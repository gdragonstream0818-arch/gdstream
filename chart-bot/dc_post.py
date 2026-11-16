import json
import time
import os

from datetime import datetime
from zoneinfo import ZoneInfo

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    NoAlertPresentException,
    UnexpectedAlertPresentException,
)


LOGIN_URL = "https://sign.dcinside.com/login"

GALLERY_URL = (
    "https://gall.dcinside.com/mgallery/board/lists?id=gdpeaceminusone"
)

# 차트 표시 순서
CHART_ORDER = [
    "melonTop100",
    "melonDaily",
    "genieTop200",
    "bugsRealtime",
]


# ==================================================
# 차트 데이터 / 글 내용
# ==================================================

def load_chart_data():

    print("===== 음총 차트 데이터 읽기 =====")

    try:
        with open("chart-data.json", "r", encoding="utf-8") as f:
            data = json.load(f)

        print("차트 기준시간:", data.get("updatedAt"))

        return data

    except Exception as e:
        print("차트 데이터 읽기 실패:", e)
        raise


def make_title():

    now = datetime.now(ZoneInfo("Asia/Seoul"))

    return f"[음원차트] {now.strftime('%m/%d %H:%M')} 업데이트"


def make_content(data):

    text = ""

    text += "📊 G-DRAGON / BIGBANG 음원 차트 현황\n\n"

    text += f"기준시간 : {data.get('updatedAt', '')}\n\n"

    charts = data.get("charts", {})

    for chart_id in CHART_ORDER:

        chart = charts.get(chart_id)

        if not chart:
            continue

        text += f"【{chart.get('name', '')}】\n"

        songs = chart.get("songs", [])

        if not songs:
            text += "차트인 없음\n\n"
            continue

        for song in songs:

            change = song.get("change", {}).get("label", "")

            text += (
                f"{song.get('rank', '')}위 "
                f"{song.get('artist', '')} - "
                f"{song.get('title', '')} "
                f"{change}\n"
            )

        text += "\n"

    text += "※ 매시간 자동 업데이트"

    return text


# ==================================================
# 브라우저
# ==================================================

def create_browser():

    options = Options()

    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--disable-gpu")
    options.add_argument("--remote-debugging-port=9222")
    options.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    )

    driver = webdriver.Chrome(options=options)

    return driver


def read_alert(driver, timeout=5):
    """alert이 뜨면 내용을 읽고 닫는다. 없으면 None."""

    end = time.time() + timeout

    while time.time() < end:
        try:
            alert = driver.switch_to.alert
            text = alert.text
            alert.accept()
            return text
        except NoAlertPresentException:
            time.sleep(0.5)

    return None


def save_state(driver, name):
    """현재 화면을 스크린샷 + HTML로 저장."""

    try:
        driver.save_screenshot(f"{name}.png")

        with open(f"{name}.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)

        print(f"{name}.png / {name}.html 저장")

    except Exception as e:
        print(f"{name} 저장 실패:", e)


# ==================================================
# 로그인 / 글쓰기 이동
# ==================================================

def login(driver):

    print("===== 로그인 시작 =====")

    driver.get(LOGIN_URL)

    wait = WebDriverWait(driver, 20)

    id_box = wait.until(
        EC.presence_of_element_located((By.NAME, "user_id"))
    )

    pw_box = wait.until(
        EC.presence_of_element_located((By.NAME, "pw"))
    )

    id_box.send_keys(os.environ["DC_ID"])
    pw_box.send_keys(os.environ["DC_PASSWORD"])

    login_btn = wait.until(
        EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "button[type='submit']")
        )
    )

    login_btn.click()

    alert_text = read_alert(driver, timeout=3)

    if alert_text:
        print("⚠️ 로그인 alert:", alert_text)

    time.sleep(3)

    print("로그인 후:", driver.current_url)

    save_state(driver, "after_login")


def move_write_page(driver):

    print("===== 글쓰기 이동 =====")

    driver.get(GALLERY_URL)

    time.sleep(5)

    links = driver.find_elements(By.TAG_NAME, "a")

    for link in links:

        text = link.text.strip()
        href = link.get_attribute("href")

        if "글쓰기" in text or "write" in str(href):

            print("글쓰기 발견:", href)

            driver.execute_script("arguments[0].click();", link)

            time.sleep(5)

            print("글쓰기 페이지 URL:", driver.current_url)

            return

    raise Exception("글쓰기 버튼 못찾음")


# ==================================================
# 글 작성 / 등록
# ==================================================

def write_post(driver, title, content):

    print("===== 글 작성 =====")

    wait = WebDriverWait(driver, 20)

    subject = wait.until(
        EC.presence_of_element_located((By.ID, "subject"))
    )

    subject.clear()
    subject.send_keys(title)

    print("제목 입력 완료")

    editor = wait.until(
        EC.presence_of_element_located(
            (By.CSS_SELECTOR, ".note-editable[contenteditable='true']")
        )
    )

    html = content.replace("\n", "<br>")

    driver.execute_script(
        """
        const editor = arguments[0];
        const html = arguments[1];

        editor.focus();
        editor.innerHTML = html;

        // summernote 내부 값 동기화 (가능한 경우)
        try {
            if (window.jQuery) {
                const $ta = window.jQuery(editor)
                    .closest('.note-editor')
                    .siblings('textarea');

                if ($ta.length && typeof $ta.summernote === 'function') {
                    $ta.summernote('code', html);
                }
            }
        } catch (e) {}

        editor.dispatchEvent(new Event('input', {bubbles: true}));
        editor.dispatchEvent(new Event('keyup', {bubbles: true}));
        editor.dispatchEvent(new Event('change', {bubbles: true}));
        """,
        editor,
        html,
    )

    print("본문 입력 완료")

    time.sleep(3)


def save_debug(driver):

    with open("final_debug.html", "w", encoding="utf-8") as f:
        f.write(driver.page_source)

    print("final_debug.html 저장")


def submit_post(driver):

    print("===== 등록 버튼 검색 =====")

    target = None

    for btn in driver.find_elements(By.TAG_NAME, "button"):
        if btn.text.strip() == "등록":
            target = btn
            break

    if target is None:
        raise Exception("등록 버튼 못찾음")

    print("등록 버튼 발견")

    driver.execute_script("arguments[0].click();", target)

    # alert이 뜨면 내용 출력
    alert_text = read_alert(driver, timeout=5)

    if alert_text:
        print("⚠️ alert 발생:", alert_text)

    time.sleep(3)

    try:
        current = driver.current_url
    except UnexpectedAlertPresentException:
        alert_text = read_alert(driver, timeout=2)
        print("⚠️ alert 발생:", alert_text)
        current = driver.current_url

    print("등록 후 URL:", current)

    # 제출 후 상태 저장
    save_state(driver, "after_submit")

    # 성공 판정: 글 보기 페이지로 넘어갔는지
    if "/board/view" in current:
        print("✅ 등록 성공:", current)
        return

    raise Exception(
        f"등록 실패 (여전히 작성 페이지): {current} / alert: {alert_text}"
    )


# ==================================================
# 실행
# ==================================================

def main():

    data = load_chart_data()

    title = make_title()

    content = make_content(data)

    print("\n===== 작성 내용 =====")
    print(content)

    driver = create_browser()

    try:

        login(driver)

        move_write_page(driver)

        write_post(driver, title, content)

        save_debug(driver)

        submit_post(driver)

    except Exception as e:

        print("❌ 오류:", e)

        save_state(driver, "error_state")

        raise

    finally:

        driver.quit()


if __name__ == "__main__":

    main()
