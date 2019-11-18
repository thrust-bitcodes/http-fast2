package br.com.softbox.thrust.httpfast;

import java.io.File;
import java.io.IOException;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Stream;

import javax.ws.rs.ProcessingException;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.json.JSONObject;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer.Alphanumeric;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import br.com.softbox.thrust.core.Thrust;
import br.com.softbox.thrust.httpfast.dto.HelloBodyRequest;
import br.com.softbox.thrust.httpfast.dto.HelloBodyResponse;

@TestMethodOrder(Alphanumeric.class)
public class HelloHttpFastSimpleTest {

	private static final Path projectPath = Paths.get("src/test/js/hello");
	private static final Path projectLibPath = projectPath.resolve(".lib");
	private static final Path projectMainPath = projectPath.resolve("hello-main.js");
	private static final Path bitcodeRootPath = projectLibPath
			.resolve(Paths.get("bitcodes", HttpFastWorkerThread.HTTP_FAST_BITCODE));
	private static ExecutorService thrustExecutorService;

	private Client restClient;

	@BeforeAll
	public static void prepare() throws Exception {
		mkdirOrClean();
		copyBitcodes();
		initThrust();
	}

	@AfterAll
	public static void finish() throws Exception {
		HttpFast httpFast = HttpFast.getInstance();
		if (httpFast != null) {
			Object[] ret = httpFast.stopServer();
			System.out.println("Finished httpserver. Errors: " + ret.length);
		}
		thrustExecutorService.shutdownNow();
	}

	static void initThrust() throws Exception {
		HttpFast.shutdown();
		thrustExecutorService = Executors.newFixedThreadPool(1);
		Exception[] error = new Exception[1];
		thrustExecutorService.execute(() -> {
			try {
				Thrust.main(new String[] { projectMainPath.toAbsolutePath().toString() });
			} catch (Exception e) {
				error[0] = e;
			}
		});
		Thread.sleep(3214);
		Assertions.assertNull(error[0]);
	}

	static void copyBitcodes() throws IOException {
		Path bitcodesSrcPath = Paths.get("lib");
		try (Stream<Path> walk = Files.list(bitcodesSrcPath)) {
			walk.forEach(HelloHttpFastSimpleTest::copyTo);
		}
	}

	static void copyTo(Path srcBitcodePath) {
		Path dstBitcodePath = bitcodeRootPath.resolve(srcBitcodePath.getFileName());
		try {
			Files.copy(srcBitcodePath, dstBitcodePath);
		} catch (IOException ioe) {
			throw new RuntimeException("Failed to copy " + srcBitcodePath, ioe);
		}
	}

	static void mkdirOrClean() throws IOException {
		clean();
		if (!bitcodeRootPath.toFile().mkdirs()) {
			throw new RuntimeException("Failed to create directory");
		}
	}

	private static void clean() throws IOException {
		if (Files.exists(bitcodeRootPath)) {
			try (Stream<Path> walk = Files.walk(projectLibPath)) {
				walk.sorted(Comparator.reverseOrder()).map(Path::toFile).forEach(File::delete);
			}
		}
	}

	@BeforeEach
	public void prepareForEachTest() {
		this.restClient = ClientBuilder.newClient();
	}

	private WebTarget target(String sufix) {
		String url = String.format("http://localhost:3000%s%s", sufix.startsWith("/") ? "" : "/", sufix);
		return restClient.target(url);
	}

	@Test
	public void test0001Root() throws Exception {
		WebTarget webTarget = target("");
		Response response = webTarget.request(MediaType.TEXT_HTML).get();
		Assertions.assertNotNull(response);
		String str = response.readEntity(String.class);
		Assertions.assertTrue(str.contains("Thrust is running"));
	}

	@Test
	public void test0002SocketPing() throws Exception {
		try (Socket socket = new Socket("localhost", 3000)) {
			Assertions.assertTrue(true);
		}
	}

	@Test
	public void test01NotFound() throws Exception {
		WebTarget webTarget = target("hello");
		Response response = webTarget.request(MediaType.APPLICATION_JSON).get();
		Assertions.assertNotNull(response);
		Assertions.assertEquals(response.getStatus(), 404);
	}

	@Test
	public void test02NoName() throws Exception {
		WebTarget webTarget = target("api/hello");
		Response response = webTarget.request(MediaType.APPLICATION_JSON).get();
		Assertions.assertNotNull(response);
		Assertions.assertEquals(response.getStatus(), 500);
	}

	@Test
	public void test03NameParam() throws Exception {
		final String keyResponse = "hello";
		String name = "someone";
		WebTarget webTarget = target("api/hello");
		Response response = webTarget.queryParam("name", name).request(MediaType.APPLICATION_JSON).get();
		Assertions.assertNotNull(response);
		Assertions.assertEquals(response.getStatus(), 200);

		Assertions.assertTrue(response.hasEntity());

		String jsonStr = response.readEntity(String.class);
		Assertions.assertNotNull(jsonStr);
		JSONObject json = new JSONObject(jsonStr);
		Assertions.assertTrue(json.has(keyResponse));
		String nameResponse = json.getString(keyResponse);
		Assertions.assertEquals(nameResponse, name);
	}

	@Test
	public void test04HeaderParam() throws Exception {
		String name = "LuizaLabs";
		WebTarget webTarget = target("api/hello");
		Response response = webTarget.queryParam("name", name).request(MediaType.APPLICATION_JSON).header("x-name", "1")
				.get();
		Assertions.assertNotNull(response);
		Assertions.assertEquals(response.getStatus(), 200);

		Assertions.assertTrue(response.hasEntity());

		String str = response.readEntity(String.class);
		Assertions.assertNotNull(str);
		Assertions.assertEquals(str, String.format("|%s|", name));
	}

	@Test
	public void test20HelloBodyXY() throws Exception {
		HelloBodyRequest requestData = new HelloBodyRequest(1, 2);
		WebTarget webTarget = target("/api/hello-body");
		HelloBodyResponse responseData = webTarget.request(MediaType.APPLICATION_JSON)
				.post(Entity.entity(requestData, MediaType.APPLICATION_JSON), HelloBodyResponse.class);
		Assertions.assertNotNull(responseData);
		Integer z = responseData.getZ();
		Assertions.assertNotNull(z);
		Assertions.assertEquals(z.intValue(), 3);
	}

	@Test
	public void test21HelloBodyNoX() throws Exception {
		HelloBodyRequest requestData = new HelloBodyRequest(0, 2);
		WebTarget webTarget = target("/api/hello-body");
		Response response = webTarget.request(MediaType.APPLICATION_JSON)
				.post(Entity.entity(requestData, MediaType.APPLICATION_JSON));
		Assertions.assertNotNull(response);
		Assertions.assertEquals(response.getStatus(), 500);
	}

	@Test
	public void test30HelloLongHead() throws Exception {
		String name = "Cabeça de teia";
		StringBuilder headTrash = new StringBuilder();
		while (headTrash.length() < 2048) {
			headTrash.append(headTrash.length() % 2 == 0 ? "a" : "b");
		}
		Response response = target("/api/hello").queryParam("name", name).request(MediaType.APPLICATION_JSON)
				.header("x-name", headTrash.toString()).get();
		Assertions.assertNotNull(response);
		Assertions.assertEquals(response.getStatus(), 200);

		Assertions.assertTrue(response.hasEntity());

		String str = response.readEntity(String.class);
		Assertions.assertNotNull(str);
		Assertions.assertEquals(str, String.format("|%s|", name));
	}

	@Test
	public void test40HelloBody2NoData() throws Exception {

		Response response = target("/api/hello-body2").request(MediaType.APPLICATION_JSON).post(Entity.json("{}"));
		Assertions.assertNotNull(response);
		Assertions.assertEquals(response.getStatus(), 200);
		@SuppressWarnings("unchecked")
		Map<String, Object> ret = response.readEntity(Map.class);
		Assertions.assertNotNull(ret);
		Assertions.assertTrue(ret.containsKey("len"));
		Number n = (Number) ret.get("len");
		Assertions.assertNotNull(n);
		Assertions.assertEquals(-1, n.intValue());

	}

	@Test
	public void test40HelloBody2SimpleData() throws Exception {
		String someInfo = "someinfo";
		Map<String, Object> map = new HashMap<>();
		map.put("info", someInfo);

		Response response = target("/api/hello-body2").request(MediaType.APPLICATION_JSON).post(Entity.json(map));
		Assertions.assertNotNull(response);
		Assertions.assertEquals(response.getStatus(), 200);
		@SuppressWarnings("unchecked")
		Map<String, Object> ret = response.readEntity(Map.class);
		Assertions.assertNotNull(ret);
		Assertions.assertTrue(ret.containsKey("len"));
		Number n = (Number) ret.get("len");
		Assertions.assertNotNull(n);
		Assertions.assertNotEquals(-1, n);
		Assertions.assertEquals(someInfo.length(), n.intValue());

	}

	@Test
	public void test40HelloBody2BigData() throws Exception {
		String someInfo = String.format("%01024d", 1243);
		Map<String, Object> map = new HashMap<>();
		map.put("info", someInfo);

		Response response = target("/api/hello-body2").request(MediaType.APPLICATION_JSON).post(Entity.json(map));
		Assertions.assertNotNull(response);
		Assertions.assertEquals(response.getStatus(), 200);
		@SuppressWarnings("unchecked")
		Map<String, Object> ret = response.readEntity(Map.class);
		Assertions.assertNotNull(ret);
		Assertions.assertTrue(ret.containsKey("len"));
		Number n = (Number) ret.get("len");
		Assertions.assertNotNull(n);
		Assertions.assertEquals(someInfo.length(), n.intValue());
	}

	@Test
	public void test90ByeInvalid() throws Exception {
		WebTarget webTarget = target("api/bye/33");
		Response response = webTarget.request(MediaType.APPLICATION_JSON).get();
		Assertions.assertNotNull(response);
		Assertions.assertEquals(500, response.getStatus());
	}

	@Test
	public void test91ByeBreakApp() throws Exception {
		try {
			target("api/bye/1").request().buildGet().invoke();
			Assertions.fail("Cannot run this");
		} catch (Exception e) {
			Assertions.assertNotNull(e);
			Assertions.assertTrue(e instanceof ProcessingException);
		}
	}
}
