"""MCP client that connects to the Hospitality Operations MCP server over stdio."""
import asyncio
import json
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


class McpClient:
    """Persistent client for the Hospitality Operations MCP server."""

    def __init__(self, server_cmd: list[str]):
        self.server_cmd = server_cmd
        self._session = None
        self._client = None
        self._lock = asyncio.Lock()
        self.connected = False
        self.error = None

    async def connect(self) -> None:
        if self.connected:
            return
        try:
            params = StdioServerParameters(command=self.server_cmd[0], args=self.server_cmd[1:])
            self._client = stdio_client(params)
            self._read, self._write = await self._client.__aenter__()
            self._session = await ClientSession(self._read, self._write).__aenter__()
            await self._session.initialize()
            self.connected = True
            self.error = None
        except Exception as exc:  # noqa: BLE001
            self.connected = False
            self.error = f"{type(exc).__name__}: {exc}"

    async def list_tools(self) -> list[str]:
        if not self.connected:
            return []
        resp = await self._session.list_tools()
        return [t.name for t in resp.tools]

    async def call(self, name: str, arguments: dict | None = None) -> dict:
        """Call an MCP tool. Raises on failure - caller handles fallback."""
        if not self.connected:
            raise RuntimeError("Hospitality MCP not connected")
        async with self._lock:
            result = await self._session.call_tool(name, dict(arguments or {}))
        if result.is_error:
            raise RuntimeError(result.content[0].text if result.content else "MCP tool error")
        text = result.content[0].text if result.content else "{}"
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"raw": text}

    async def close(self) -> None:
        try:
            if self._session:
                await self._session.__aexit__(None, None, None)
            if self._client:
                await self._client.__aexit__(None, None, None)
        except Exception:  # noqa: BLE001
            pass
        self.connected = False


def default_mcp_client() -> McpClient:
    python = Path(__file__).resolve().parent / ".venv" / "bin" / "python"
    if not python.exists():
        python = Path(__file__).resolve().parent / ".venv" / "Scripts" / "python.exe"
    if not python.exists():
        import sys

        python = Path(sys.executable)
    server = Path(__file__).resolve().parent / "mcp_server.py"
    return McpClient([str(python), str(server)])
