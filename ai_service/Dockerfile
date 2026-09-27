FROM python:3.12

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY ./requirements.txt requirements.txt

RUN pip install -r requirements.txt

WORKDIR /usr/ai_service_app

COPY ./app .

CMD [ "uvicorn", "main:app", "--host=0.0.0.0" , "--port=8001", "--reload", "--reload-dir", "/usr/ai_service_app" ]

#TODO: When docker compose will be added, CMD has to be moved from dockerfile to docker compose file