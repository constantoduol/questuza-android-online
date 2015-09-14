package com.quest.uza.online;

import android.webkit.JavascriptInterface;



/**
 * Created by Connie on 07-Dec-14.
 */
public class JavascriptExtensions {
    @JavascriptInterface
    public void setItem(String key, String value){
        Database.put(key,value);
    }

    @JavascriptInterface
    public String getItem(String key){
        return Database.get(key);
    }

    @JavascriptInterface
    public void removeItem(String key){
        Database.remove(key);
    }
    
   @JavascriptInterface
    public String loadPage(String url){
        return MainActivity.getInstance().loadPage(url);
    }
}
