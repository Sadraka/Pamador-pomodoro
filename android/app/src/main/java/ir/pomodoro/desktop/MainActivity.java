package ir.pomodoro.desktop;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // The system paints a square highlight (theme colorPrimary) over the
        // WebView on touch-down. Our buttons draw their own pressed states in
        // CSS, so switch every native highlight off.
        WebView webView = this.bridge.getWebView();
        webView.setDefaultFocusHighlightEnabled(false);
        webView.setHapticFeedbackEnabled(false);
        WebSettings settings = webView.getSettings();
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
    }
}
