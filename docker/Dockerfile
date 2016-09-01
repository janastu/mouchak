FROM tiangolo/uwsgi-nginx-flask:flask

RUN apt-get update && apt-get install libturbojpeg1 libturbojpeg1-dev && rm -rf /var/lib/apt/lists/*


RUN pip install cffi
COPY ./requirements.txt /requirements.txt
RUN pip install -r /requirements.txt

COPY ./mouchak /app
COPY ./mouchak/server.py /app/main.py

COPY ./docker/create-conf.sh /create-conf.sh
RUN /bin/bash /create-conf.sh
