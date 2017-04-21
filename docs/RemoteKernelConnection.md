# Remote kernels via kernel gateways

In addition to managing local kernels and connecting to them over ZeroMQ, Hydrogen is also able to connect to Jupyter Notebook (or Jupyter Kernel Gateway) servers. This is most useful for running code remotely (e.g. in the cloud).

To connect to a server, you must first add the connection information to the Hydrogen `gateways` setting. An example settings entry might be:

```json
[{
  "name": "Remote notebook",
  "options": {
    "baseUrl": "http://example.com:8888",
    "token": "my_secret_token"
  }
}]
```

Each entry in the gateways list needs at minimum a `name` (for displaying in the UI), and a value for `options.baseUrl`. The `options.token` should only be present if your server requires token authentication, in which case it should contain the specific token issued by your server. (Token authentication is enabled by default for Jupyter Notebook 4.3 or later). The `options` are passed directly to the [`@jupyterlab/services`](https://github.com/jupyterlab/services) npm package, which includes documentation for additional fields.

After gateways have been configured, you can use the **"Hydrogen: Connect to Remote Kernel"** command. You will be prompted to select a gateway, and then given the choice to either create a new session or connect to an existing one.

Unlike with local kernels, Hydrogen does not kill remote kernels when it disconnects from them. This allows sharing remote kernels between Hydrogen and the Notebook UI, as well as using them for long-running processes. To clean up unused kernels, you must explicitly call the **"Hydrogen: Shutdown Kernel"** command while connected to a kernel.

## Example with notebook server

To set up a server on the remote machine, you could

- Install Jupyter Notebook:

```bash
pip install jupyter
```

- Check to see if you have the notebook configuration file, `jupyter_notebook_config.py`. By default, it is located in `~/.jupyter`. If you don't already have one, create one by running the command:

```bash
jupyter notebook --generate-config
```

- Edit `jupyter_notebook_config.py` and find the line that says `#c.NotebookApp.token = ''`. Change it to say `c.NotebookApp.token = 'my_secret_token'`, substituting your choice of token string. (If you skip this step, the token will change every time the notebook server restarts).

- To run a server that listens on localhost, use the command:

```bash
jupyter notebook --port=8888
```

- To run a public server, consult the [official instructions](http://jupyter-notebook.readthedocs.io/en/latest/public_server.html) for setting up certificates. Skip the steps for setting up a password: hydrogen only supports token-based authentication. Also note that hydrogen does not support self-signed certificates -- we recommend that you use Let's Encrypt or consider alternatives such as listening on localhost followed by SSH port forwarding.

## Example with kernel gateway server

As of December 2016, we recommend that you use a notebook server (version 4.3 or greater) instead of the Jupyter Kernel Gateway. We expect this to change in the future, and will update this README when that occurs.

# Docker execution via kernel gateways

You can use the same technique to create a kernel gateway in a Docker container. That would allow you to develop from Atom but with all the dependencies, autocompletion, environment, etc. of a Docker container.

**Note**: due to the way that the kernel gateway creates sub-processes for each kernel, you have to use it in a special way, you can't run the `jupyter kernelgateway` directly in your `Dockerfile` `CMD` section. You need to call it with an init manager such as [**tini**](https://github.com/krallin/tini) or run it from an interactive console.

If all you need is a Docker Python environment to execute your code, you can read the section [**Example Jupyter Docker Stack kernel gateway**](#example-jupyter-docker-stack-kernel-gateway) (this method uses **tini** under the hood).

If you want to add a temporal Kernel Gateway (for development) to your current Docker images or need to modify an existing image to add the Kernel Gateway functionality, read the section [**Example Docker kernel gateway**](#example-docker-kernel-gateway) (this method runs the kernel gateway from an interactive console).

## Example Jupyter Docker Stack kernel gateway

Follow this if you only need to have a simple environment to run commands inside a Docker container and nothing more.

If you need to customize a Docker image (e.g. for web development) follow the section below: [**Example Docker kernel gateway**](#example-docker-kernel-gateway).

### Dockerfile

- Create a `Dockerfile` based on one of the [Jupyter Docker Stacks](https://github.com/jupyter/docker-stacks).
- Install `jupyter_kernel_gateway` in your `Dockerfile`
- Expose the gateway port, in this example it will be `8888`
- Make the command to run be the Kernel Gateway:

```Dockerfile
FROM jupyter/minimal-notebook

RUN pip install jupyter_kernel_gateway

EXPOSE 8888
CMD ["jupyter", "kernelgateway", "--KernelGatewayApp.ip=0.0.0.0", "--KernelGatewayApp.port=8888"]
```

### Run Docker Container with Docker commands

**Note**: alternatively, see below for `docker-compose` instructions.

- Build your container:

```bash
docker build -t hydro-kernel-gateway .
```

- Run your container mapping the port of the gateway
- Give your container a name

```bash
docker run -it --rm --name hydro-kernel-gateway -p 8888:8888 hydro-kernel-gateway
```

**Note**: you will only be able to run one container using that port mapping. So, if you had another container using that port, you will have to stop that one first. Or alternatively, you can create a mapping to a new port and add that configuration in the Hydrogen settings (see below).

### Run Docker Container with Docker Compose

- Create a `docker-compose.yml` file with something like:

```yml
version: '2'
services:
  hydro-kernel-gateway:
    build: .
    ports:
      - "8888:8888"
```

- The `docker-compose.yml` file has a port mapping using the port exposed in the `Dockerfile` and used in the `jupyter kernelgateway` command

**Note**: you will only be able to run one container using that port mapping. So, if you had another container using that port, you will have to stop that one first. Or alternatively, you can create a mapping to a new port and add that configuration in the Hydrogen settings (see below).

- Now start (and build) your container with `docker-compose`:

```bash
docker-compose up -d
```

- Check the name of your running container with:

```bash
docker-compose ps
```

### Connect Atom

Now you need to connect Atom to your setup. Follow the section [**Connect Atom**](#connect-atom-1) below.

## Example Docker kernel gateway

Follow this if you need to customize a Docker image you already have. For example, for a web project.

If you only need a simple environment in where to run Python commands with Hydrogen inside a Docker container, follow the section above: [**Example Jupyter Docker Stack kernel gateway**](#example-jupyter-docker-stack-kernel-gateway).

### Dockerfile

- Create a `Dockerfile`
- Install `jupyter_kernel_gateway` in your `Dockerfile`
- Expose the gateway port, in this example it will be `8888`:

```Dockerfile
FROM python:2.7

# Remove in production
RUN pip install jupyter_kernel_gateway
EXPOSE 8888
```

### Run Docker Container with Docker commands

**Note**: alternatively, see below for `docker-compose` instructions.

- Build your container:

```bash
docker build -t hydro .
```

- Run your container mapping the port of the gateway
- Give your container a name
- Make it run an infinite loop that just keeps the container alive:

```bash
docker run -d -p 8888:8888 --name hydro  hydro bash -c "while true; do sleep 10; done"
```

**Note**: you will only be able to run one container using that port mapping. So, if you had another container using that port, you will have to stop that one first. Or alternatively, you can create a mapping to a new port and add that configuration in the Hydrogen settings (see below).

- Execute an interactive bash session in your running container:

```bash
docker exec -it hydro bash
```

- From that interactive session, start the gateway
- Specify the IP `0.0.0.0` to make your container listen to public connections
- Specify the port that you exposed in your `Dockerfile`:

```bash
jupyter kernelgateway --ip=0.0.0.0 --port=8888
```

### Run Docker Container with Docker Compose

- Create a `docker-compose.yml` file with something like:

```yml
version: '2'
services:
  hydro:
    build: .
    ports:
      - "8888:8888"
    command: bash -c "while true; do sleep 10; done"
```

- The `docker-compose.yml` file has a port mapping using the port exposed in the `Dockerfile` and used in the `jupyter kernelgateway` command
- The `command` overrides the default `CMD` in the `Dockerfile` (if there was one) and executes an infinite loop that would just keep the container alive

**Note**: you will only be able to run one container using that port mapping. So, if you had another container using that port, you will have to stop that one first. Or alternatively, you can create a mapping to a new port and add that configuration in the Hydrogen settings (see below).

- Now start (and build) your container with `docker-compose`:

```bash
docker-compose up -d
```

- Check the name of your running container with:

```bash
docker-compose ps
```

- Execute an interactive bash session in your running container (use the name from above), e.g.:

```bash
docker exec -it myproject_hydro_1 bash
```

- From that interactive session, start the gateway
- Specify the IP `0.0.0.0` to make your container listen to public connections
- Specify the port that you exposed in your `Dockerfile`:

```bash
jupyter kernelgateway --ip=0.0.0.0 --port=8888
```

## Connect Atom

- Go to the settings in Atom with: `ctrl-shift-p` and type `Settings View: Open`
- Go to the "Packages" section
- Type `Hydrogen` and go to package settings
- In the section "List of kernel gateways to use" add settings for the container your created
- Use a `name` that you can remind when running Hydrogen
- In the `baseUrl` section use the host or IP that you use to access your Docker containers:
  - If you are using Docker Toolbox in Windows or Mac (or Docker for Windows, Docker for Mac), as it will be running in a virtual machine, the IP (host) would probably be like: `192.168.99.100`, you can read about it and check the `docker-machine ip default` command [in the official Docker docs](https://docs.docker.com/machine/get-started/#/run-containers-and-experiment-with-machine-commands)
  - If you are using Docker in a Linux machine and you are running Atom in that same machine you can just use `localhost` as the host of your `baseUrl`
- For example, a possible configuration for Docker Toolbox in Windows or Mac could be:

```JSON
[{"name": "Docker Toolbox", "options": {"baseUrl": "http://192.168.99.100:8888"}}]
```

- In Atom, open a Python file, e.g. `main.py`
- Connect to the kernel you just configured: `ctrl-shift-p` and type: `Hydrogen: Connect To Remote Kernel`
- Select the kernel gateway you configured, e.g. `Docker Toolbox`
- Select the "type of kernel" to run, there will just be the option `Python 2` or `Python 3`
- Then select the line or block of code that you want to execute inside of your container
- Run the code with: `ctrl-shift-p` and type: `Hydrogen: Run`

## Testing it

You can test that it is actually working by installing a package in your container that you don't have locally and using it inside your container (from your Atom editor).

- For example, install the Python package `markdown` in your `Dockerfile`:

```Dockerfile
FROM python:2.7

RUN pip install markdown

# Remove in production
RUN pip install jupyter_kernel_gateway
EXPOSE 8888
```

**Note**: If you followed the [**Example Jupyter Docker Stack kernel gateway**](#example-jupyter-docker-stack-kernel-gateway) section, your `Dockerfile` will look different. Just make sure you add a line with:

```Dockerfile
RUN pip install markdown
```

- Follow all the instructions above, and use a Python file that has:

```python
import markdown
markdown.version
```

- Select the code and run it with: `ctrl-shift-p` and type `Hydrogen: Run`, you will see the code executed inline like:

```python
import markdown [✓]
markdown.version ['2.6.6']
```

## Terminate the connection and container

- To terminate a running kernel gateway you can "kill" it as any Linux process with `ctrl-c`

- If you followed the [**Example Jupyter Docker Stack kernel gateway**](#example-jupyter-docker-stack-kernel-gateway) section, it will just work.

But, if you are using the general instructions (for a custom Docker image), because of the way Jupyter Kernel Gateway creates sub-processes and due to the fact that you are running in a Docker container, the actual kernel process will still be running.

- Before exiting the terminal, find the still running (Python) kernel process with:

```bash
ps -fA
```

- You will get something like:

```
root@6d09f8fee132:/# ps -fA
UID        PID  PPID  C STIME TTY          TIME CMD
root         1     0  0 00:21 ?        00:00:00 bash -c while true; do sleep 10; done
root        10     0  0 00:22 ?        00:00:00 bash
root        23     0  0 00:22 ?        00:00:00 /usr/local/bin/python2 -m ipykernel -f /root/.local/share/jupyter/runtime/kernel-95baef8a-6427-4415-bc95-e02dc74e4ebb.js
root        77     1  0 00:28 ?        00:00:00 sleep 10
root        78    10  0 00:28 ?        00:00:00 ps -fA
```

- Kill the `ipykernel` process by killing all the `python` processes:

```bash
pkill python
```

- Now you can exit the interactive terminal with:

```bash
exit
```
