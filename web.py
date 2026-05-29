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
