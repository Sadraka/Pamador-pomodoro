package ir.pomodoro.desktop;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onResume() {
        super.onResume();
        disableNativeHighlights();
    }

    /** The system paints a square highlight over the WebView on touch-down.
     *  Our buttons draw their own pressed states in CSS, so turn every
     *  native highlight off (works on any Android version). Runs on every
     *  resume so it applies no matter when the bridge finishes building. */
    private void disableNativeHighlights() {
        if (bridge == null) return;
        WebView webView = bridge.getWebView();
        if (webView == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            webView.setDefaultFocusHighlightEnabled(false);
        }
        webView.setHapticFeedbackEnabled(false);
        // Recolor whatever the platform still draws to the app paper color.
        webView.setBackgroundColor(Color.parseColor("#161e18"));
    }
}
