FROM oven/bun
WORKDIR /srv/app

RUN apt update
RUN apt install python3 python3-pip -y
RUN pip3 install myougiden
RUN updatedb-myougiden -f

RUN apt-get update && apt-get install -y tzdata
ENV TZ=Asia/Tokyo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY ./package.json .
COPY ./modules/*.ts ./modules/
COPY ./index.ts .
RUN bun install
ENTRYPOINT [ "bun", "run", "index.ts" ]
