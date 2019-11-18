package br.com.softbox.thrust.httpfast;

import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.ByteBuffer;
import java.nio.channels.SelectionKey;
import java.nio.channels.SocketChannel;
import java.util.Arrays;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.graalvm.polyglot.Value;

import br.com.softbox.thrust.api.thread.LocalWorkerThreadPool;
import br.com.softbox.thrust.api.thread.ThrustWorkerThread;

public class HttpFastWorkerThread extends ThrustWorkerThread {

	protected static final String HTTP_FAST_BITCODE = "thrust-bitcodes/http-fast2";
	private static final List<String> JS_FILES = Arrays.asList("params.js", "request.js", "response.js", "router.js");
	private static final Logger logger = Logger.getLogger(HttpFastWorkerThread.class.getName());

	private SelectionKey key;

	private Value jsParamsCode;
	private Value jsRequestCode;
	private Value jsResponseCode;
	private Value jsRouterCode;

	public HttpFastWorkerThread(LocalWorkerThreadPool pool, String routesFilePath, String middlewaresFilePath,
			String afterRequestFnFilePath) throws IOException, URISyntaxException {
		super(pool, HTTP_FAST_BITCODE, JS_FILES);
		setJsCode();
		invokerJsRouterCode(routesFilePath, middlewaresFilePath, afterRequestFnFilePath);
	}

	private synchronized void setJsCode() {
		jsParamsCode = this.listJS.get(0);
		jsRequestCode = this.listJS.get(1);
		jsResponseCode = this.listJS.get(2);
		jsRouterCode = this.listJS.get(3);
	}

	private void invokerJsRouterCode(String routesFilePath, String middlewaresFilePath, String afterRequestFnFilePath) {
		jsRouterCode.invokeMember("mapVirtualRoutes", routesFilePath);
		jsRouterCode.invokeMember("mapMiddlewares", middlewaresFilePath);
		jsRouterCode.invokeMember("loadAfterRequestFn", afterRequestFnFilePath);

	}

	@Override
	public void run() {
		SelectionKey currentKey;
		while (active.get()) {
			synchronized (this) {
				currentKey =  this.key;
			}
			try {
				drainChannel(currentKey);
			} catch (Exception e) {
				logger.log(Level.SEVERE, getName() + ": Failed drain channel", e);
				closeAndWakeupKey(currentKey);
			}
			this.pool.returnThrustWorkerThread(this);
			try {
				synchronized (this) {
					if (active.get()) {
						this.wait();
					}
				}
			} catch (InterruptedException e) {
				logger.log(Level.WARNING, getName() + ": Thread was interrupeted", e);
				this.active.set(false);
				Thread.currentThread().interrupt();
			}
		}
	}

	private void closeAndWakeupKey(SelectionKey currentKey) {
		try {
			currentKey.channel().close();
		} catch (IOException ex) {
			logger.log(Level.WARNING, "Failed close key channel", ex);
		}
		try {
			currentKey.selector().wakeup();
		} catch (RuntimeException e) {
			logger.log(Level.WARNING, "Failed to wakeup selector", e);
		}
	}

	/**
	 * Called to initiate a unit of work by this worker thread on the provided
	 * SelectionKey object. This method is synchronized, as is the run( ) method, so
	 * only one key can be serviced at a given time. Before waking the worker
	 * thread, and before returning to the main selection loop, this key's interest
	 * set is updated to remove OP_READ. This will cause the selector to ignore
	 * read-readiness for this channel while the worker thread is servicing it.
	 */
	protected synchronized void serviceChannel(SelectionKey newKey) {
		key = newKey;
		key.interestOps(key.interestOps() & (~SelectionKey.OP_READ));
		startCurrentThread();
	}

	/**
	 * The actual code which drains the channel associated with the given key. This
	 * method assumes the key has been modified prior to invocation to turn off
	 * selection interest in OP_READ. When this method completes it re-enables
	 * OP_READ and calls wakeup( ) on the selector so the selector will resume
	 * watching this channel.
	 */
	private void drainChannel(SelectionKey currentKey) throws Exception {
		int bytesRead;
		ByteBuffer buffer = ByteBuffer.allocate(1024 * 32);
		SocketChannel channel = (SocketChannel) currentKey.channel();
		// Loop while data is available; channel is nonblocking
		while ((bytesRead = channel.read(buffer)) > 0) {
			buffer.flip(); // make buffer readable
			handleRequest(buffer, channel);
			buffer.clear(); // Empty buffer
		}
		// Keep-alive not implemented yet: se nao keep alive
		if (bytesRead < 0) {
			channel.close();
			return;
		}
		// Resume interest in OP_READ
		currentKey.interestOps(currentKey.interestOps() | SelectionKey.OP_READ);
		// Cycle the selector so this key is active again
		currentKey.selector().wakeup();
	}

	private synchronized void handleRequest(ByteBuffer buffer, SocketChannel channel) {
		Value request = this.jsRequestCode.execute(channel, buffer);
		Value response = this.jsResponseCode.execute(channel);
		Value params = this.jsParamsCode.execute(request.getMember("queryString"), request.getMember("contentType"));
		this.jsRouterCode.invokeMember("process", params, request, response);
	}

}
