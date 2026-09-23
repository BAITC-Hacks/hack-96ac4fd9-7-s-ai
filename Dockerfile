FROM python:3.13-slim
WORKDIR /app
COPY server.py matcher.py evidence.py catalog_service.py planner.py ai_agent.py ai_transport.py ./
COPY data ./data
COPY static ./static
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["python", "server.py", "--host", "0.0.0.0"]
