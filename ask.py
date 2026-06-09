#pip install google-genai
from google import genai

from google.genai import types

#from PIL import Image
#import numpy as np, easyocr

import requests
from bs4 import BeautifulSoup

from flask import Flask, render_template, request, make_response, jsonify
from datetime import datetime
import random

import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

# 判斷是在 Vercel 還是本地
if os.path.exists('serviceAccountKey.json'):
    # 本地環境：讀取檔案
    cred = credentials.Certificate('serviceAccountKey.json')
else:
    # 雲端環境：從環境變數讀取 JSON 字串
    firebase_config = os.getenv('FIREBASE_CONFIG')
    cred_dict = json.loads(firebase_config)
    cred = credentials.Certificate(cred_dict)

firebase_admin.initialize_app(cred)


app = Flask(__name__)

client = genai.Client()

@app.route("/AI")
def AI():
    # 每次使用者拜訪該路徑時，直接使用全域的 client 呼叫模型
    response = client.models.generate_content(
        model='gemini-3.1-flash-lite',
        contents='我想查詢靜宜大學資管系的評價？',
    )
    
    # 回傳生成的文字
    return response.text


@app.route('/ask', methods=['GET', 'POST']) 
def ask():
    if request.method == "POST":
        user_prompt = request.form.get('prompt', '')
        if not user_prompt:
            return "請輸入內容", 400
        try:
            response = client.models.generate_content(
                model='gemini-3.1-flash-lite',
                contents=user_prompt,
            )
            return response.text
        except Exception as e:
            return f"發生錯誤: {str(e)}", 500

    else:    
        # 當使用者直接打開網頁 (GET) 時，顯示輸入框畫面
        return render_template("ask.html")


@app.route("/webhook", methods=["POST"])
def webhook():
    # build a request object
    req = request.get_json(force=True)
    # fetch queryResult from json
    action =  req["queryResult"]["action"]
    #msg =  req["queryResult"]["queryText"]
    #info = "我是楊子青設計的電影聊天機器人, 動作：" + action + "； 查詢內容：" + msg
    if (action == "rateChoice"):
        rate =  req["queryResult"]["parameters"]["rate"]
        info = "我是楊子青設計的電影聊天機器人,您選擇的電影分級是：" + rate + "，相關電影：\n"

        db = firestore.client()
        collection_ref = db.collection("本週新片含分級")
        docs = collection_ref.get()
        result = ""
        for doc in docs:
            dict = doc.to_dict()
            if rate in dict["rate"]:
                result += "片名：" + dict["title"] + ";\n"
                result += "連結：" + dict["hyperlink"] + "\n\n"

        info += result


    elif (action == "input.unknown"):
        #info = req["queryResult"]["queryText"]
        
        instruction_text = (
            "你是一個熱心且知識豐富的專業智慧助理。"
            "對於使用者的提問，請回覆重點的關鍵字，不要重述問題。"         
        )


        ai_config = types.GenerateContentConfig(
            max_output_tokens=500, 
            system_instruction=instruction_text
        )

        response = client.models.generate_content(
            model='gemini-3.1-flash-lite', 
            contents=req["queryResult"]["queryText"],
            config=ai_config,
        )

        if response.text:
            info = response.text
        else:
            info = "抱歉，我現在無法生成回應，請稍後再試。"



    return make_response(jsonify({"fulfillmentText": info}))

@app.route("/road")
def road():
    R = ""
    url = "https://newdatacenter.taichung.gov.tw/api/v1/no-auth/resource.download?rid=a1b899c0-511f-4e3d-b22b-814982a97e41"
    Data = requests.get(url, verify=False)
    #print(Data.text)

    JsonData = json.loads(Data.text)
    for item in JsonData:
        R += item["路口名稱"] + ",總共發生" + item["總件數"] + "件事故<br>"
    return R


if __name__ == "__main__":
    app.run(debug=True)
