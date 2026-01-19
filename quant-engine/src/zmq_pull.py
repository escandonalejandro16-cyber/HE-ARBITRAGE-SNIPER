import zmq

def create_pull_socket(address="tcp://127.0.0.1:5555"):
    context = zmq.Context.instance()
    socket = context.socket(zmq.PULL)
    socket.bind(address)
    return socket
