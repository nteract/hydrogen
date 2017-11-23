# Remote kernels

In addition to managing local kernels and connecting to them over ZeroMQ, Hydrogen is also able to connect to Jupyter Notebook servers. This is most useful for running code remotely (e.g. in the cloud), or in a Docker container running locally.

To connect to a server, add the connection information to the Hydrogen `gateways` setting. For example:

```json
[{
  "name": "Remote server",
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

# Running a notebook server using Docker

You can use the same technique to create a notebook server in a Docker container. That would allow you to develop from Atom but with all the dependencies, autocompletion, environment, etc. of a Docker container.

**Note**: due to the way that the notebook creates sub-processes for each kernel, you have to use it in a special way, you can't run the `jupyter notebook` directly in your `Dockerfile` `CMD` section. You need to call it with an init manager such as [**tini**](https://github.com/krallin/tini) or run it from an interactive console.


### Dockerfile

- Create a `Dockerfile` based on either one of the [Jupyter Docker Stacks](https://github.com/jupyter/docker-stacks) (recommended), or your own
- Ensure `jupyter` and `tini` are installed, either in the image or as an additional command in the `Dockerfile`
- Expose the gateway port, in this example it will be `8888`
- Set the `CMD` instruction to starting a notebook server, run through an init manager such as `tini`:

```Dockerfile
# If using your own Docker image, use the following `FROM` command syntax substituting your image name
FROM jupyter/minimal-notebook

ADD https://github.com/krallin/tini/releases/download/v0.14.0/tini /tini
RUN chmod +x /tini

# If using your own Docker image without jupyter installed:
# RUN pip install jupyter

ENV JUPYTER_TOKEN=my_secret_token  # you can also pass this at runtime

EXPOSE 8888
ENTRYPOINT [/tini, --]
# --no-browser & --port aren't strictly necessary. presented here for clarity
CMD [jupyter-notebook, --no-browser, --port=8888]
# if running as root, you need to explicitly allow this:
# CMD [jupyter-notebook, --allow-root, --no-browser, --port=8888]

```

### Run with Docker Compose

- Create a `docker-compose.yml` file with something like:

```yml
version: '2'
services:
  hydro:
    build: .
    entrypoint: [/tini, --]
    command: [jupyter-notebook, --allow-root, --no-browser, --port=8888]
    ports:
      - 8888:8888
    environment:
      # the value of `JUPYTER_TOKEN` in your environment will override `my_secret_token`
      - JUPYTER_TOKEN=my_secret_token
```

- This duplicates the entrypoint & command between this and the Dockerfile - strictly speaking, you only need one of these

**Note**: you will only be able to run one container using that port mapping. So, if you had another container using that port, you will have to stop that one first. Or alternatively, you can create a mapping to a new port and add that configuration in the Hydrogen settings (see below).

- Now start (and build) your container with `docker-compose`:

```bash
docker-compose up -d
```


### Run with Docker commands

- Build your container:

```bash
docker build -t hydro .
```

- Run your container mapping the port of the gateway
- Give your container a name

```bash
docker run -it --rm --name hydro -p 8888:8888 -e JUYTER_TOKEN=my_secret_token hydro
```


## Connect Atom

- Add the connection information to the Hydrogen `gateways` setting, as above. If running locally, you can use `localhost` as the host of your `baseUrl`
- In Atom, open a Python file
- Connect to the kernel you just configured: `ctrl-shift-p` and type: `Hydrogen: Connect To Remote Kernel`
- Select the kernel gateway you configured, e.g. `Remote server`
- Select the "type of kernel" to run, there will just be the option `Python 2` or `Python 3`
- Then select the line or block of code that you want to execute inside of your container
- Run the code with: `ctrl-shift-p` and type: `Hydrogen: Run`

## Testing it

You can test that it is actually working by installing a package in your container that you don't have locally and using it inside your container (from your Atom editor).

- For example, install the Python package `markdown` in your `Dockerfile`:

```Dockerfile
FROM jupyter/minimal-notebook

ADD https://github.com/krallin/tini/releases/download/v0.14.0/tini /tini
RUN chmod +x /tini

ENV JUPYTER_TOKEN=my_secret_token # you can also pass this at runtime

EXPOSE 8888
ENTRYPOINT [/tini, --]
CMD [jupyter-notebook, --no-browser, --port=8888]

RUN pip install markdown # <- installing new package
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

- To terminate a running notebook server you can "kill" it as any Linux process with `ctrl-c`
- If you're running the notebook server as a Docker container, you can stop the Docker container (this assumes you're using an init manager, such as tini. If you're not, this may not close the process.)
