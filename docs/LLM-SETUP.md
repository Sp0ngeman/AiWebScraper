## Local LLM Setup

This project can use a local OpenAI-compatible server (e.g. Ollama, LM Studio) for chat and vision.

### 1) Install a server
- Ollama: `https://ollama.com` (enable server on `127.0.0.1:11434`)
- LM Studio: enable local server and pick a model

### 2) Choose a model
Pick a model that supports vision (image input) if you want Browser-Use-like analysis. Example identifiers vary by runtime.

### 3) Configure `config.env`
```
LOCAL_LLM_URL=http://127.0.0.1:1234
LOCAL_LLM_MODEL=deepseek/deepseek-r1-0528-qwen3-8b
```

### 4) Test
- Start `web-gui` and use the "Run Browser-Use Task" button.
- Check logs in `logs/` if requests fail.
