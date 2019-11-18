package br.com.softbox.thrust.httpfast;

import java.io.IOException;
import java.net.URISyntaxException;

import br.com.softbox.thrust.api.thread.LocalWorkerThreadPool;
import br.com.softbox.thrust.api.thread.ThrustWorkerThread;
import br.com.softbox.thrust.api.thread.ThrustWorkerThreadBuilder;

public class HttpFastWorkerBuilder implements ThrustWorkerThreadBuilder {

	private String routesFilePath;
	private String middlewaresFilePath;
	private String afterRequestFnFilePath;

	public HttpFastWorkerBuilder(String routesFilePath, String middlewaresFilePath, String afterRequestFnFilePath) {
		super();
		this.routesFilePath = routesFilePath;
		this.middlewaresFilePath = middlewaresFilePath;
		this.afterRequestFnFilePath = afterRequestFnFilePath;
	}

	@Override
	public ThrustWorkerThread build(LocalWorkerThreadPool pool) throws IOException, URISyntaxException {
		return new HttpFastWorkerThread(pool, routesFilePath, middlewaresFilePath, afterRequestFnFilePath);
	}

}
