FROM python:3.12-slim

# Ngăn Python tạo các file bộ nhớ đệm .pyc và ép log xuất hiện realtime
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Cài đặt các gói hệ thống tối thiểu cần thiết để build thư viện kết nối MySQL (mysqlclient)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libmariadb-dev \
    pkg-config \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Sao chép file danh sách thư viện và cài đặt vào môi trường Docker
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ mã nguồn backend vào trong Container
COPY . /app/