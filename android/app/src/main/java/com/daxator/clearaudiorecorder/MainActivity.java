package com.daxator.clearaudiorecorder;

import android.os.Bundle;
import android.view.KeyEvent;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ClearNativePlugin.class);
        super.onCreate(savedInstanceState);
    }

    // Volume keys can control the recorder when the user turns that on in the app.
    // (Android does not let any app take over the power button.)
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int code = event.getKeyCode();
        boolean isVolume = code == KeyEvent.KEYCODE_VOLUME_UP || code == KeyEvent.KEYCODE_VOLUME_DOWN;
        if (isVolume && ClearNativePlugin.captureVolume) {
            if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0 && getBridge() != null) {
                String key = code == KeyEvent.KEYCODE_VOLUME_UP ? "up" : "down";
                getBridge().triggerWindowJSEvent("clearHardwareKey", "{\"key\":\"" + key + "\"}");
            }
            return true; // swallow the press so the volume does not change
        }
        return super.dispatchKeyEvent(event);
    }
}
