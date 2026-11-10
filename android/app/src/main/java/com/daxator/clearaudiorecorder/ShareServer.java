package com.daxator.clearaudiorecorder;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Minimal HTTP server for "Send to PC". It serves a download page and the chosen files,
 * only to devices on the same local network, only under a random 6-digit PIN path,
 * and it shuts itself down after 15 minutes.
 */
class ShareServer {

    static class Item {
        final File file; final String name;
        Item(File file, String name) { this.file = file; this.name = name; }
    }

    private static final long LIFETIME_MS = 15 * 60 * 1000L;
    private final List<Item> items;
    private final String pin;
    private final AtomicInteger downloads = new AtomicInteger();
    private final AtomicInteger badTries = new AtomicInteger();
    private final ExecutorService pool = Executors.newFixedThreadPool(4);
    private volatile ServerSocket socket;
    private volatile boolean running;
    private long startedAt;

    ShareServer(List<Item> items, String pin) { this.items = items; this.pin = pin; }

    int downloads() { return downloads.get(); }

    int start() throws IOException {
        IOException last = null;
        for (int port : new int[] { 8080, 8081, 8088, 0 }) {
            try { socket = new ServerSocket(port); break; } catch (IOException e) { last = e; }
        }
        if (socket == null) throw last != null ? last : new IOException("no port");
        running = true;
        startedAt = System.currentTimeMillis();
        Thread t = new Thread(this::acceptLoop, "clear-share");
        t.setDaemon(true);
        t.start();
        return socket.getLocalPort();
    }

    void stop() {
        running = false;
        try { if (socket != null) socket.close(); } catch (IOException ignored) { }
        pool.shutdownNow();
    }

    private void acceptLoop() {
        while (running) {
            try {
                final Socket client = socket.accept();
                if (System.currentTimeMillis() - startedAt > LIFETIME_MS) { client.close(); stop(); return; }
                pool.execute(() -> handle(client));
            } catch (IOException e) {
                if (!running) return;
            } catch (RuntimeException e) {
                return;
            }
        }
    }

    private void handle(Socket client) {
        try (Socket c = client) {
            c.setSoTimeout(15000);
            InetAddress from = c.getInetAddress();
            // Same-network devices only.
            if (!(from.isSiteLocalAddress() || from.isLoopbackAddress() || from.isLinkLocalAddress())) return;
            InputStream in = new BufferedInputStream(c.getInputStream());
            String requestLine = readLine(in);
            if (requestLine == null) return;
            String line;
            int guard = 0;
            while ((line = readLine(in)) != null && !line.isEmpty() && guard++ < 100) { /* skip headers */ }
            String[] parts = requestLine.split(" ");
            OutputStream out = c.getOutputStream();
            if (parts.length < 2 || !(parts[0].equals("GET") || parts[0].equals("HEAD"))) { send(out, 405, "text/plain", "Method not allowed"); return; }
            boolean head = parts[0].equals("HEAD");
            String path = parts[1];
            int q = path.indexOf('?');
            if (q >= 0) path = path.substring(0, q);
            if (path.equals("/favicon.ico")) { send(out, 404, "text/plain", "Not found"); return; }
            if (badTries.get() > 20) { send(out, 429, "text/plain", "Too many wrong codes. Open Send to PC again on the phone."); return; }
            String base = "/" + pin;
            if (path.equals(base) || path.equals(base + "/")) { send(out, 200, "text/html; charset=utf-8", page()); return; }
            if (path.startsWith(base + "/f/")) {
                int idx;
                try { idx = Integer.parseInt(path.substring((base + "/f/").length())); } catch (NumberFormatException e) { idx = -1; }
                if (idx < 0 || idx >= items.size()) { send(out, 404, "text/plain", "Not found"); return; }
                Item it = items.get(idx);
                String encoded = URLEncoder.encode(it.name, "UTF-8").replace("+", "%20");
                String headers = "HTTP/1.1 200 OK\r\n"
                        + "Content-Type: " + mime(it.name) + "\r\n"
                        + "Content-Length: " + it.file.length() + "\r\n"
                        + "Content-Disposition: attachment; filename*=UTF-8''" + encoded + "\r\n"
                        + "Cache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n";
                out.write(headers.getBytes(StandardCharsets.UTF_8));
                if (!head) {
                    try (FileInputStream fis = new FileInputStream(it.file)) {
                        byte[] buf = new byte[64 * 1024];
                        int n;
                        while ((n = fis.read(buf)) > 0) out.write(buf, 0, n);
                    }
                    downloads.incrementAndGet();
                }
                out.flush();
                return;
            }
            badTries.incrementAndGet();
            send(out, 404, "text/html; charset=utf-8", "<!doctype html><meta charset=utf-8><body style='background:#08090a;color:#eeeae2;font-family:system-ui;padding:40px'>Wrong code. Check the address shown in Clear Audio Recorder.</body>");
        } catch (IOException ignored) {
        }
    }

    private static String readLine(InputStream in) throws IOException {
        StringBuilder sb = new StringBuilder();
        int ch, count = 0;
        while ((ch = in.read()) != -1) {
            if (ch == '\n') break;
            if (ch != '\r') sb.append((char) ch);
            if (++count > 8192) return null;
        }
        if (ch == -1 && sb.length() == 0) return null;
        return sb.toString();
    }

    private static void send(OutputStream out, int code, String type, String body) throws IOException {
        byte[] b = body.getBytes(StandardCharsets.UTF_8);
        String status = code == 200 ? "OK" : code == 404 ? "Not Found" : code == 405 ? "Method Not Allowed" : "Error";
        String h = "HTTP/1.1 " + code + " " + status + "\r\nContent-Type: " + type + "\r\nContent-Length: " + b.length
                + "\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nX-Frame-Options: DENY\r\nConnection: close\r\n\r\n";
        out.write(h.getBytes(StandardCharsets.UTF_8));
        out.write(b);
        out.flush();
    }

    private static String mime(String name) {
        String n = name.toLowerCase();
        if (n.endsWith(".mp3")) return "audio/mpeg";
        if (n.endsWith(".wav")) return "audio/wav";
        return "application/octet-stream";
    }

    private static String esc(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private static String size(long bytes) {
        if (bytes >= 1048576) return String.format("%.1f MB", bytes / 1048576.0);
        return Math.max(1, bytes / 1024) + " KB";
    }

    private String page() {
        StringBuilder rows = new StringBuilder();
        for (int i = 0; i < items.size(); i++) {
            Item it = items.get(i);
            rows.append("<a class=row href=\"/").append(pin).append("/f/").append(i).append("\"><span><b>")
                .append(esc(it.name)).append("</b><i>").append(size(it.file.length()))
                .append("</i></span><em>Download</em></a>");
        }
        return "<!doctype html><html lang=en><head><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\">"
            + "<title>Clear Audio Recorder</title><style>"
            + "body{margin:0;background:#08090a;color:#eeeae2;font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}"
            + "main{max-width:640px;margin:0 auto;padding:48px 20px}"
            + "h1{font-size:15px;letter-spacing:.26em;font-weight:700;margin:0 0 28px}h1 span{color:#d6ff3f}"
            + "h2{font-size:30px;line-height:1.1;margin:0 0 8px;letter-spacing:-.02em}p{color:#8f969b;margin:0 0 28px}"
            + ".row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;margin-bottom:10px;"
            + "background:#111315;border:1px solid rgba(255,255,255,.08);border-radius:18px;color:inherit;text-decoration:none}"
            + ".row:hover{border-color:rgba(214,255,63,.5)}.row span{min-width:0}.row b{display:block;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"
            + ".row i{font-style:normal;color:#8f969b;font-size:13px}"
            + ".row em{font-style:normal;font-weight:600;font-size:14px;color:#0b0d02;background:#d6ff3f;padding:9px 16px;border-radius:999px;white-space:nowrap;"
            + "box-shadow:0 8px 30px -8px rgba(214,255,63,.55)}"
            + "small{display:block;color:#8f969b;margin-top:24px;font-size:13px}"
            + "</style></head><body><main><h1>CLEAR <span>&#10022;</span></h1><h2>Your recordings</h2>"
            + "<p>Sent straight from your phone over Wi-Fi. Nothing is uploaded to the internet.</p>"
            + rows
            + "<small>This page stops working when you close Send to PC on the phone, or after 15 minutes.</small></main></body></html>";
    }
}
