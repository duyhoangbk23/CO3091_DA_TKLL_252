# Báo cáo LaTeX

Báo cáo cho đề tài: **Hệ thống IoT RTOS giám sát và điều chỉnh chất lượng không khí (IAQ)**.

## Cấu trúc thư mục

```text
.
|-- assets/
|   `-- images/
|-- config/
|   |-- metadata.tex
|   |-- packages.tex
|   `-- settings.tex
|-- frontmatter/
|   |-- cover.tex
|   `-- abstract.tex
|-- sections/
|   |-- 01-gioi-thieu-de-tai.tex
|   |-- 02-yeu-cau-va-co-so-ly-thuyet.tex
|   |-- 03-kien-truc-he-thong.tex
|   |-- 04-thiet-ke-phan-cung.tex
|   |-- 05-firmware-doc-du-lieu.tex
|   |-- 06-thiet-ke-rtos-va-iot.tex
|   |-- 07-server-dashboard-web.tex
|   |-- 08-kiem-thu-va-danh-gia.tex
|   |-- 09-ket-luan-va-huong-phat-trien.tex
|   `-- 10-tai-lieu-tham-khao.tex
`-- main.tex
```

## Biên dịch

VS Code/LaTeX Workshop đã được cấu hình để dùng `pdflatex` thay cho `latexmk`.

```bash
pdflatex main.tex
pdflatex main.tex
```
