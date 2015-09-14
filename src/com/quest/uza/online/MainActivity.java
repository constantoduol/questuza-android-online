package com.quest.uza.online;


import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Random;

public class MainActivity extends Activity {
    
    private static WebView wv = null;
    
    private static Database db;
    
    private static String SERVER_ADDRESS = "https://test-quest-uza.appspot.com";
    
    private static MainActivity instance;
    
    
       @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main);
        wv = (WebView) findViewById(R.id.html_viewer);
        WebSettings settings = wv.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabasePath("/data/data/" + wv.getContext().getPackageName() + "/databases/");
        WebChromeClient webChrome = new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.i("JCONSOLE", consoleMessage.lineNumber()
                        + ": " + consoleMessage.message());
                return true;
            }
        };
        wv.addJavascriptInterface(new JavascriptExtensions(), "jse");
        wv.setWebChromeClient(webChrome);
        wv.loadUrl("file:///android_asset/index.html");
        instance = this;
        db = new Database(this);
        setUpServerDetails();
    }
    
    private void setUpServerDetails(){
        boolean exists = Database.ifValueExists("server_ip", "KEY_STORAGE", "LOCAL_DATA");
        if(!exists) Database.put("server_ip",SERVER_ADDRESS);//dont override a local server configuration
        
        boolean exists1 = Database.ifValueExists("device_name", "KEY_STORAGE", "LOCAL_DATA");
        if(!exists1) Database.put("device_name",new UniqueRandom(10).nextMixedRandom());//dont override a local name configuration
        
        boolean exists2 = Database.ifValueExists("default_printer", "KEY_STORAGE", "LOCAL_DATA");
        if(!exists2) Database.put("default_printer","None");//dont override a local printer configuration
    }
    
    public static String convertStreamToString(InputStream is) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(is));
        StringBuilder sb = new StringBuilder();
        String line = null;
        while ((line = reader.readLine()) != null) {
            sb.append(line).append("\n");
        }
        reader.close();
        return sb.toString();
    }

    public String loadPage(String uri) {
        String html;
        try {
            html = convertStreamToString(getAssets().open(uri));
        } catch (Exception e) {
            html = "error";
            e.printStackTrace();
        }
        return html;
    }
    
    public static MainActivity getInstance(){
        return instance;
    }
    
    
}
