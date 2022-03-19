FROM ubuntu:focal
RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y tzdata
RUN apt-get install -y wget unzip ffmpeg python3 python3-pip libsndfile-dev
RUN pip3 install --upgrade pip
RUN pip3 install spleeter youtube-dl

RUN apt-get install -y curl

RUN curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | tee /etc/apt/sources.list.d/ngrok.list && apt update && apt install ngrok

RUN apt-get install -y openssh-server
RUN ssh-keygen -A -v
RUN mkdir /var/run/sshd

COPY ./ngrok.yml /root/ngrok.yml
RUN mkdir /root/.ssh
COPY ./authorized_keys /root/.ssh/authorized_keys
RUN chmod 400 /root/.ssh/authorized_keys

COPY ./utilities.sh /root/utilities.sh
WORKDIR /root
