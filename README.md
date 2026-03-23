# Lyra-Assistant

[![Hugging Face Model](https://img.shields.io/badge/-HuggingFace-3B4252?style=flat&logo=huggingface&logoColor=)](https://huggingface.co/zzztzzzt)
[![GitHub last commit](https://img.shields.io/github/last-commit/zzztzzzt/Lyra-Assistant.svg)](https://github.com/zzztzzzt/Lyra-Assistant)
[![CodeQL Advanced](https://github.com/zzztzzzt/Lyra-Assistant/actions/workflows/codeql.yml/badge.svg)](https://github.com/zzztzzzt/Lyra-Assistant/actions/workflows/codeql.yml)
[![GitHub repo size](https://img.shields.io/github/repo-size/zzztzzzt/Lyra-Assistant.svg)](https://github.com/zzztzzzt/Lyra-Assistant)
[![Lyra](https://img.shields.io/badge/Designed_with-Lyra-FFC6EC?logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjEzMDAiIHZpZXdCb3g9IjAgMCA4MDAgMTMwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iNzUiIHk9Ijc1IiB3aWR0aD0iNjUwIiBoZWlnaHQ9IjExNTAiIHN0cm9rZT0idXJsKCNwYWludDBfbGluZWFyXzIxNjVfNykiIHN0cm9rZS13aWR0aD0iMTUwIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMjE2NV83IiB4MT0iNDAwIiB5MT0iMCIgeDI9IjQwMCIgeTI9IjEzMDAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iI0JCRkZFRCIvPgo8c3RvcCBvZmZzZXQ9IjAuNjk3MTE1IiBzdG9wLWNvbG9yPSIjRkZFQ0Y0Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+)](https://github.com/zzztzzzt/Lyra-AI)

<br>

<img src="https://github.com/zzztzzzt/Lyra-Assistant/blob/main/logo/logo.png" alt="lyra-logo" style="height: 280px; width: auto;" />

### Lyra-Assistant : Next Generation AI Color Palette / Web Gradients.

IMPORTANT : This project is still in the development and testing stages, licensing terms may be updated in the future. Please don't do any commercial usage currently.

## Project Dependencies Guide

[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://github.com/pytorch/pytorch)
[![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://github.com/langchain-ai/langchain)
[![Llama3.1](https://img.shields.io/badge/Llama3.1-0467DF?style=for-the-badge&logo=meta&logoColor=white)](https://github.com/meta-llama/llama)
[![Ollama](https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white)](https://github.com/ollama/ollama)

**( APP )**

[![Django](https://img.shields.io/badge/Django-3776AB?style=for-the-badge&logo=django&logoColor=white)](https://github.com/django/django)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://github.com/facebook/react)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://github.com/oven-sh/bun)
[![Tailwind CSS](https://img.shields.io/badge/tailwind_css-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://github.com/tailwindlabs/tailwindcss)

**[ for Dependencies Details please see the end of this README ]**

Lyra-Assistant uses Django & Django REST framework for backend. Django licensed under the BSD 3-Clause License. Django REST framework's license is in their License Page, please see link at the end of this README.

Lyra-Assistant uses React & Tailwind CSS for Frontend Design. And uses Bun as build tool. React & Tailwind CSS licensed under the MIT License. Bun has additional description in their license page, please see link below.

![2.0showcase](https://github.com/zzztzzzt/Lyra-Assistant/blob/main/showcase/Lyra_Assistant_2.0_showcase.png)

**( Classic Mode )**

![2.0showcase2](https://github.com/zzztzzzt/Lyra-Assistant/blob/main/showcase/Lyra_Assistant_2.0_showcase_2.png)

## Get Started

### Step 1. Install Ollama & Llama 3.1

Install Link : [https://ollama.com/download](https://ollama.com/download)

on CMD, run `ollama pull llama3.1:8b`, it will install `llama3.1:8b` for you.

### Step 2. Fill `.env` file

go into `Backend/assistantbackend` folder

create file `.env` and configure your `.env` file according to the contents of `.env.example`

### Step 3. Setup Backend

**Build Dependencies ( Install uv )**

upgrade : `python -m pip install --upgrade pip`

use uv : `python -m pip install uv` & `python -m uv sync`

**Database Migration**

go into `Backend/assistantbackend` folder

initialize DB : `python -m uv run python manage.py migrate`

**Run Backend Server**

go into `Backend/assistantbackend` folder

`python -m uv run python manage.py runserver`

### Step 4. Setup Frontend

## Convert `Lux.jl` Model to `PyTorch` Model

put your `trained_color_model.jld2` into `models` folder

back to project root

run below :

```shell
python -m uv run python scripts/convert_lyra_jld2_to_pytorch.py models/trained_color_model.jld2 models/trained_color_model.pt
```

then your model will be saved to `models/trained_color_model.pt`

run below to test prediction :

```shell
python -m uv run python scripts/lyra_torch_infer.py models/trained_color_model.pt --oklch 0.63 0.22 32.4
```

if you change `Activation Function` in your new Model, you need to also change this file : `\src\lyra_inference\src\lyra_inference\model.py`

if there are Errors during conversion, use below command to debug

```shell
python -m uv run python scripts/model_conversion_debug/inspect_lyra_pt.py models/trained_color_model.pt
```
also check original JLD2 model
```shell
python -m uv run python scripts/model_conversion_debug/inspect_lyra_jld2.py models/trained_color_model.jld2
```

## Project Detail / Debug

### Upgrade / Downgrade Python Version : 

run `python -m uv python install 3.xx`

and

`python -m uv python pin 3.xx`

### Add new Custom Package :

go into `src` folder

run `python -m uv init --lib your_package`

then go into the folder it create for you ( which cotain `pyproject.toml` )

run `python -m uv add [package_you_need_in_your_custom_package]`

and then keep going deeper to `./src/[your_package]/` & add your code there

finally, go to `every place except project_root` where needs your custom package & run `python -m uv add --editable /path/to/project_root/src/your_package`
( please note that on production environment you may need to disable `--editable` )

### Create Account for Django Admin :

go into `Backend/assistantbackend` folder

run `python -m uv run python manage.py createsuperuser`
you can leave blank at Email field

in local test, open default `http://127.0.0.1:8000/admin/` & login

### Register Models to Django Admin :

from [YOURAPPNAME]/admin.py

```python
from django.contrib import admin

# Register your models here.
from .models import YourModel

admin.site.register(YourModel)
```

in local test, open default `http://127.0.0.1:8000/admin/` again

### Add new App to Django :

go into `Backend/assistantbackend` folder

run `python -m uv run python manage.py startapp [YOURAPPNAME]`

create file : [YOURAPPNAME]/urls.py & add below :

```python
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
]
```

create file : [YOURAPPNAME]/serializers.py ( for the content please see other apps' `serializers.py` )

and then add below to **assistantbackend/assistantbackend/urls.py** :

```python
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("[YOURAPPNAME]/", include("[YOURAPPNAME].urls")),
    path("admin/", admin.site.urls),
]
```

go into **assistantbackend/assistantbackend/settings.py** and add below

```python
INSTALLED_APPS = [
    '[YOURAPPNAME]',
]
```

## Version History

#### Lyra Assistant 2.0

![2.0showcase](https://github.com/zzztzzzt/Lyra-Assistant/blob/main/showcase/Lyra_Assistant_2.0_showcase.png)

#### Lyra Assistant 2.0 Classic

![2.0showcase2](https://github.com/zzztzzzt/Lyra-Assistant/blob/main/showcase/Lyra_Assistant_2.0_showcase_2.png)

#### Lyra Assistant 1.0

![1.0showcase](https://github.com/zzztzzzt/Lyra-Assistant/blob/main/showcase/Lyra_Assistant_1.0_showcase.webp)

#### Lyra Assistant 1.0 Dark Mode

![1.0showcase2](https://github.com/zzztzzzt/Lyra-Assistant/blob/main/showcase/Lyra_Assistant_1.0_showcase_2.webp)

## Project Dependencies Details

Django License : [https://github.com/django/django/blob/main/LICENSE](https://github.com/django/django/blob/main/LICENSE)
<br>

Django REST framework License : [https://github.com/encode/django-rest-framework](https://github.com/encode/django-rest-framework)
<br>

React License : [https://github.com/facebook/react/blob/main/LICENSE](https://github.com/facebook/react/blob/main/LICENSE)
<br>

Tailwind CSS License : [https://github.com/tailwindlabs/tailwindcss/blob/main/LICENSE](https://github.com/tailwindlabs/tailwindcss/blob/main/LICENSE)
<br>

Bun License : [https://github.com/oven-sh/bun/blob/main/LICENSE.md](https://github.com/oven-sh/bun/blob/main/LICENSE.md)