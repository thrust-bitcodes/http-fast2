package br.com.softbox.thrust.httpfast;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Stream;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import br.com.softbox.thrust.core.Thrust;

public class NoRouteHttpFastNoPingTest {

	private static final Path projectPath = Paths.get("src/test/js/no-route");
	private static final Path projectLibPath = projectPath.resolve(".lib");
	private static final Path projectMainPath = projectPath.resolve("no-route.js");
	private static final Path bitcodeRootPath = projectLibPath
			.resolve(Paths.get("bitcodes", HttpFastWorkerThread.HTTP_FAST_BITCODE));
	private static ExecutorService thrustExecutorService;

	@BeforeAll
	public static void prepare() throws Exception {
		mkdirOrClean();
		copyBitcodes();
		initThrust();
	}

	@AfterAll
	public static void finish() throws Exception {
		Object[] ret = HttpFast.shutdown();
		Assertions.assertNotNull(ret);
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
		if (error[0] != null && error[0].toString().contains("Server already")) {

		}
		Assertions.assertNull(error[0]);
	}

	static void copyBitcodes() throws IOException {
		Path bitcodesSrcPath = Paths.get("lib");
		try (Stream<Path> walk = Files.list(bitcodesSrcPath)) {
			walk.forEach(NoRouteHttpFastNoPingTest::copyTo);
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

	@Test
	public void confirmWasInitated() throws Exception {
		HttpFast httpFast = HttpFast.getInstance();
		Assertions.assertNotNull(httpFast);
		try {
			HttpFast.startServer(1, 1, Thrust.getAppDirectory(), "", "", "");
			Assertions.fail("Cannot run this");
		} catch (RuntimeException e) {
			Assertions.assertTrue(e.getMessage().contains("Server already started"));
		}
	}
}
