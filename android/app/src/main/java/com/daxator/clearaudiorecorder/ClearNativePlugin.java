package com.daxator.clearaudiorecorder;

import android.view.WindowManager;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.io.File;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Small native helpers for Clear Audio Recorder:
 *  - volume-button capture (see MainActivity)
 *  - keep the screen awake while recording
 *  - "Send to PC": a tiny web server on the phone, reachable only on the same Wi-Fi
 */
@CapacitorPlugin(name = "ClearNative")
public class ClearNativePlugin extends Plugin {

    public static volatile boolean captureVolume = false;
    private ShareServer server;

    @PluginMethod
    public void setVolumeCapture(PluginCall call) {
        captureVolume = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        call.resolve();
    }

    @PluginMethod
    public void keepAwake(PluginCall call) {
        final boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        getActivity().runOnUiThread(() -> {
            if (on) getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            else getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        });
        call.resolve();
    }

    @PluginMethod
    public void startShare(PluginCall call) {
        stopServer();
        try {
            JSArray arr = call.getArray("files");
            if (arr == null || arr.length() == 0) { call.reject("No files to share"); return; }
            File cacheRoot = getContext().getCacheDir().getCanonicalFile();
            List<ShareServer.Item> items = new ArrayList<>();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                String path = o.getString("path");
                if (path.startsWith("file://")) path = path.substring(7);
                File f = new File(path).getCanonicalFile();
                // Only files this app prepared in its own cache folder can be served.
                if (!f.getPath().startsWith(cacheRoot.getPath() + File.separator) || !f.isFile()) continue;
                items.add(new ShareServer.Item(f, o.optString("name", f.getName())));
            }
            if (items.isEmpty()) { call.reject("No files to share"); return; }
            String ip = localIp();
            if (ip == null) { call.reject("NO_WIFI"); return; }
            String pin = String.format("%06d", new SecureRandom().nextInt(1000000));
            server = new ShareServer(items, pin);
            int port = server.start();
            JSObject ret = new JSObject();
            ret.put("url", "http://" + ip + ":" + port + "/" + pin);
            ret.put("ip", ip);
            ret.put("port", port);
            ret.put("pin", pin);
            ret.put("count", items.size());
            call.resolve(ret);
        } catch (Exception e) {
            stopServer();
            call.reject("Could not start sharing: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopShare(PluginCall call) {
        stopServer();
        call.resolve();
    }

    @PluginMethod
    public void shareStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("running", server != null);
        ret.put("downloads", server != null ? server.downloads() : 0);
        call.resolve(ret);
    }

    private void stopServer() {
        if (server != null) { server.stop(); server = null; }
    }

    @Override
    protected void handleOnDestroy() {
        stopServer();
        captureVolume = false;
    }

    /** First private IPv4 address of this phone (its Wi-Fi or hotspot address). */
    private static String localIp() {
        try {
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!ni.isUp() || ni.isLoopback()) continue;
                for (InetAddress a : Collections.list(ni.getInetAddresses())) {
                    if (a instanceof Inet4Address && a.isSiteLocalAddress()) return a.getHostAddress();
                }
            }
        } catch (Exception ignored) { }
        return null;
    }
}
