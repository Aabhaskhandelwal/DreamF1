FROM python:3.13-slim

RUN pip install uv

WORKDIR /app

COPY pyproject.toml .
RUN uv pip install --system --no-cache .

COPY app/ ./app/
COPY main.py .
RUN mkdir -p cache

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]