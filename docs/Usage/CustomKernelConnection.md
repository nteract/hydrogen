# Custom kernel connection example (inside Docker)

**Note**: Hydrogen now supports using [**kernel gateways**](RemoteKernelConnection.md). Using that option is simpler in most of the use cases. For example, it will allow you to use the functionality from a Docker virtual machine in Windows or Mac as easily as if it was Linux.
The recommended way of connecting to remote kernels is now using [**kernel gateways**](RemoteKernelConnection.md).

You can use a custom kernel connection file to connect to a previously created kernel.

For example, you can run a kernel inside a Docker container and make Hydrogen connect to it automatically.

Hydrogen will look for a kernel JSON connection file under `./hydrogen/connection.json` inside your project. If that file exists, Hydrogen will try to connect to the kernel specified by that connection file.

Here's a simple recipe for doing and testing that with Python:

* In your project directory, create a `Dockerfile` with:

```
FROM python:2.7

RUN pip install markdown # Delete this line after testing

RUN pip install ipykernel
RUN echo "alias hydrokernel='python -m ipykernel "'--ip=$(hostname -I)'" -f /tmp/hydrogen/connection.json'" >> /etc/bash.bashrc
```

You will test using the Python package `markdown` from inside the Docker container in your local Atom editor, with autocompletion, etc.

The last two lines are the only (temporary) addition to your `Dockerfile` that will allow you to develop locally using the remote Python kernel. If you already have a Python project with a `Dockerfile` you only need to copy those 2 lines and add them to it:

```
RUN pip install ipykernel
RUN echo "alias hydrokernel='python -m ipykernel "'--ip=$(hostname -I)'" -f /tmp/hydrogen/connection.json'" >> /etc/bash.bashrc
```

The first of those two lines will install the Python package `ipykernel`, which is the only requisite to run the remote Python kernel.

The second line creates a handy shortcut named `hydrokernel` to run a Python kernel that listens on the container's IP address and writes the connection file to `/tmp/hydrogen/connection.json`.

* Run your container mounting a volume that maps `./hydrogen/` in your local project directory to `/tmp/hydrogen/` in your container. That's the trick that will allow Hydrogen to connect to the kernel running inside your container automatically. It's probably better to run it with the command `bash` and start the kernel manually, so that you can restart it if you need to (or if it dies).

### Running using docker build

* Build your container with:

```
docker build -t python-docker .
```

```
docker run -it --name python-docker -v $(pwd)/hydrogen:/tmp/hydrogen python-docker bash
```

* Next, you just have to call the alias command we created in the `Dockerfile`, that will start the kernel with all the parameters needed:

```
hydrokernel
```
Please see below for information to do after your container has started running.

### Running using docker-compose

If you try to use `docker-compose` with the Dockerfile as above you might not be able to connect to hydrokernel. This is because the ports have been not forwarded and cannot be accessed from outside of the new docker-compose sub-network. You need to forward these ports manually in the `docker-compose.yml` file.

To ensure the ports used by hydrokernel are the same each time it loads you must specify them on the command line. Do not try and use/modify connection.json as it is overwritten on startup.
```
python -m ipykernel --stdin=45323 --iopub=43223 --shell=41454 --control=44186 --hb=40772 --ip=0.0.0.0 -f /tmp/hydrogen/connection.json
```
You may notice that the IP address given is different, `0.0.0.0` binds to all possible interfaces.

Create `docker-compose.yml` and paste the following:
```
version: '2'
services:
  hydrokernel:
    build: .
    ports: #FROM connection.json
      - "45323:45323"
      - "44186:44186"
      - "40772:40772"
      - "41454:41454"
      - "43223:43223"
    volumes:
      - ./hydrogen:/tmp/hydrogen #hydrogen connection info
    command: python -m ipykernel --stdin=45323 --iopub=43223 --shell=41454 --control=44186 --hb=40772 --ip=0.0.0.0 -f /tmp/hydrogen/connection.json
```
Key points:
* Ensure `docker-compose.yml` is in the same directory as your `Dockerfile`. If you have put your Dockerfile in a subfolder then modify the `build` entry for the hydrokernel service in the `docker-compose.yml` file to point to the Dockerfile.

* Ensure that the ports that are forwarded are exactly the same on the host machine as the container i.e. port 45323 should be forwarded to 45253. Reason being, Hydrogen will attempt to connect using the ports in the connection.json file which will be described as the container sees them, not the host.

* You could also run the command in the Dockerfile as a `CMD` entry but this way it's crystal clear what ports we're forwarding, there are quite a few so switching between files to get them is a headache!

You can then use `docker-compose up` in the same directory as docker-compose.yml to start it up.

Please see below for information to do after your container has started running.

### When your container is running
* You will see an output similar to:

```
root@24ae5d04ef3c:/# hydrokernel
NOTE: When using the `ipython kernel` entry point, Ctrl-C will not work.

To exit, you will have to explicitly quit this process, by either sending
"quit" from a client, or using Ctrl-\ in UNIX-like environments.

To read more about this, see https://github.com/ipython/ipython/issues/2049


To connect another client to this kernel, use:
    --existing /tmp/hydrogen/connection.json
```

* And you will see that a file was created in `./hydrogen/connection.json` inside your project directory.

* Now you can create a file `test.py` with:

```
import markdown
markdown.version
```

* Select the contents and run them with Hydrogen ("`cmd-shift-P`" and "`Hydrogen: run`").

* You will see the inline execution and output that just ran from your kernel, even if you don't have the Python package `markdown` installed locally, because it's running inside your container.

```
import markdown [✓]
markdown.version ['2.6.6']
```
