package br.com.softbox.thrust.httpfast;

import java.io.IOException;
import java.nio.channels.SelectionKey;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import br.com.softbox.thrust.api.thread.LocalWorkerThreadPool;
import br.com.softbox.thrust.api.thread.ThrustWorkerThread;

/**
 * Specialization of the SelectSockets class which uses a thread pool to service
 * channels. The thread pool is an ad-hoc implementation quicky lashed togther
 * in a few hours for demonstration purposes. It's definitely not production
 * quality.
 *
 * @author Ron Hitchens (ron@ronsoft.com)
 */
public class HttpFast extends SelectSockets {

	private final LocalWorkerThreadPool httpFastPool;
	private final HttpFastWorkerBuilder httpFastWorkerBuilder;

	private List<ThrustWorkerThread> workersOnService;

	private static HttpFast instance;

	private HttpFast(int minThreads, int maxThreads, String rootPath, String routesFilePath, String middlewaresFilePath,
			String afterRequestFnFilePath) throws Exception {
		this.httpFastWorkerBuilder = new HttpFastWorkerBuilder(routesFilePath, middlewaresFilePath,
				afterRequestFnFilePath);
		this.httpFastPool = new LocalWorkerThreadPool(minThreads, maxThreads, rootPath, this.httpFastWorkerBuilder);
		this.workersOnService = new ArrayList<>(maxThreads);
	}

	public static synchronized HttpFast startServer(int minThreads, int maxThreads, String rootPath,
			String routesFilePath, String middlewaresFilePath, String afterRequestFnFilePath) throws Exception {
		if (instance != null) {
			throw new RuntimeException("Server already started");
		}
		instance = new HttpFast(minThreads, maxThreads, rootPath, routesFilePath, middlewaresFilePath,
				afterRequestFnFilePath);
		return instance;
	}

	public static synchronized HttpFast getInstance() {
		return instance;
	}

	/**
	 * Sample data handler method for a channel with data ready to read. This method
	 * is invoked from the go( ) method in the parent class. This handler delegates
	 * to a worker thread in a thread pool to service the channel, then returns
	 * immediately.
	 *
	 * @param key A SelectionKey object representing a channel determined by the
	 *            selector to be ready for reading. If the channel returns an EOF
	 *            condition, it is closed here, which automatically invalidates the
	 *            associated key. The selector will then de-register the channel on
	 *            the next select call.
	 */
	@Override
	protected void readDataFromSocket(SelectionKey key) throws IOException {
		HttpFastWorkerThread worker = (HttpFastWorkerThread) httpFastPool.getThrustWorkerThread();
		worker.serviceChannel(key);
		removeNotAliveWorkersAndAddNewWorker(worker);
	}

	private synchronized void removeNotAliveWorkersAndAddNewWorker(HttpFastWorkerThread newWorker) {
		ThrustWorkerThread worker;
		for (Iterator<ThrustWorkerThread> it = this.workersOnService.iterator(); it.hasNext();) {
			worker = it.next();
			if (!worker.isAlive()) {
				it.remove();
			}
		}
		this.workersOnService.add(newWorker);
	}

	public Object[] stopServer() {
		List<Exception> exceptions = new ArrayList<>();
		stopServerSocket(exceptions);
		stopServerChannel(exceptions);
		shutdownPool(exceptions);
		interruptLocalWorkers(exceptions);
		return exceptions.toArray();
	}

	protected synchronized static Object[] shutdown() {
		Object[] ret;
		if (instance != null) {
			ret = instance.stopServer();
			instance = null;
		} else {
			ret = new Object[0];
		}
		return ret;
	}

	private void shutdownPool(List<Exception> exceptions) {
		try {
			this.httpFastPool.shutdown(true);
		} catch (Exception e) {
			exceptions.add(e);
		}
	}

	private void stopServerChannel(List<Exception> exceptions) {
		try {
			if (this.serverChannel != null) {
				this.serverChannel.close();
			}
		} catch (Exception e) {
			exceptions.add(e);
		} finally {
			this.serverChannel = null;
		}
	}

	private void stopServerSocket(List<Exception> exceptions) {
		try {
			if (this.serverSocket != null) {
				this.serverSocket.close();
			}
		} catch (Exception e) {
			exceptions.add(e);
		} finally {
			this.serverSocket = null;
		}
	}

	private synchronized void interruptLocalWorkers(List<Exception> exceptions) {
		for (ThrustWorkerThread worker : this.workersOnService) {
			if (worker.isAlive()) {
				try {
					worker.inactivate();
					worker.interrupt();
				} catch (Exception e) {
					exceptions.add(e);
				}
			}
		}
	}
}