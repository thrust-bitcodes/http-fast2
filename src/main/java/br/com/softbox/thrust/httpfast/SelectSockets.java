package br.com.softbox.thrust.httpfast;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.nio.channels.SelectableChannel;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.ServerSocketChannel;
import java.util.Iterator;

/**
 * Simple echo-back server which listens for incoming stream connections and
 * echoes back whatever it reads. A single Selector object is used to listen to
 * the server socket (to accept new connections) and all the active socket
 * channels.
 *
 * @author Ron Hitchens (ron@ronsoft.com)
 */
public abstract class SelectSockets {

	protected ServerSocketChannel serverChannel;
	protected ServerSocket serverSocket;

	public SelectSockets() {
		// Use the same byte buffer for all channels. A single thread is
		// servicing all the channels, so no danger of concurrent acccess.
	}

	public void go(int portNumber) throws IOException {
		// Allocate an unbound server socket channel
		serverChannel = ServerSocketChannel.open();
		// Get the associated ServerSocket to bind it with
		serverSocket = serverChannel.socket();
		// Create a new Selector for use below
		Selector selector = Selector.open();
		// Set the port the server channel will listen to
		serverSocket.bind(new InetSocketAddress(portNumber));
		// Set nonblocking mode for the listening socket
		serverChannel.configureBlocking(false);
		// Register the ServerSocketChannel with the Selector
		serverChannel.register(selector, SelectionKey.OP_ACCEPT);
		while (this.serverSocket != null) {
			// This may block for a long time. Upon returning, the
			// selected set contains keys of the ready channels.
			if (selector.select() > 0) {
				iterateOverSelectKey(selector);
			}
		}
	}

	private void iterateOverSelectKey(Selector selector) throws IOException {
		// Get an iterator over the set of selected keys
		SelectionKey key;
		for (Iterator<?> it = selector.selectedKeys().iterator(); it.hasNext();) {
			// Look at each key in the selected set
			key = (SelectionKey) it.next();
			// Is a new connection coming in?
			if (key.isAcceptable()) {
				registerChannel(selector, ((ServerSocketChannel) key.channel()).accept(), SelectionKey.OP_READ);
			}
			// Is there data to read on this channel?
			if (key.isReadable()) {
				readDataFromSocket(key);
			}
			// Remove key from selected set; it's been handled
			it.remove();
		}
	}

	/**
	 * Register the given channel with the given selector for the given operations
	 * of interest
	 */
	protected void registerChannel(Selector selector, SelectableChannel channel, int ops) throws IOException {
		if (channel != null) {
			// Set the new channel nonblocking
			channel.configureBlocking(false);
			// Register it with the selector
			channel.register(selector, ops);
		}
	}

	/**
	 * Sample data handler method for a channel with data ready to read.
	 *
	 * @param key A SelectionKey object associated with a channel determined by the
	 *            selector to be ready for reading. If the channel returns an EOF
	 *            condition, it is closed here, which automatically invalidates the
	 *            associated key. The selector will then de-register the channel on
	 *            the next select call.
	 */
	protected abstract void readDataFromSocket(SelectionKey key) throws IOException;
}