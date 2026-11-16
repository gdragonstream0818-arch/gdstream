import html
import json
import os
import time

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
    TimeoutException,
    ElementClickInterceptedException,
    ElementNotInteractableException,
    StaleElementReferenceException,
)


LOGIN_URL = "https://sign.dcinside.com/login"

GALLERY_URL = (
    "https://gall.dcinside.com/mgallery/board/lists"
    "?id=gdpeaceminusone"
)

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
    lines = [
        "📊 G-DRAGON / BIGBANG 음원 차트 현황",
        "",
        f"기준시간 : {data.get('updatedAt', '')}",
        "",
    ]

    charts = data.get("charts") or {}

    for chart_id in CHART_ORDER:
        chart = charts.get(chart_id)

        if not chart:
            continue

        lines.append(f"【{chart.get('name', '')}】")

        songs = chart.get("songs") or []

        if not songs:
            lines.extend(["차트인 없음", ""])
            continue

        for song in songs:
            change = (song.get("change") or {}).get("label", "")

            lines.append(
                f"{song.get('rank', '')}위 "
                f"{song.get('artist', '')} - "
                f"{song.get('title', '')} "
                f"{change}"
            )

        lines.append("")

    lines.append("※ 매시간 자동 업데이트")

    return "\n".join(lines)


# ==================================================
# 브라우저 / 공통 기능
# ==================================================

def create_browser():
    options = Options()

    # 브라우저를 직접 보면서 확인하려면 아래 줄을 주석 처리하세요.
    options.add_argument("--headless=new")

    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-gpu")

    driver = webdriver.Chrome(options=options)
    driver.set_page_load_timeout(60)

    return driver


def read_alert(driver, timeout=5):
    """alert이 뜨면 내용을 읽고 확인 버튼을 누릅니다."""
    deadline = time.monotonic() + timeout

    while time.monotonic() < deadline:
        try:
            alert = driver.switch_to.alert
            text = alert.text
            alert.accept()
            return text

        except NoAlertPresentException:
            time.sleep(0.2)

    return None


def save_state(driver, name):
    """스크린샷과 HTML을 저장합니다."""
    try:
        driver.save_screenshot(f"{name}.png")

        with open(f"{name}.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)

        print(f"{name}.png / {name}.html 저장")

    except Exception as e:
        print(f"{name} 저장 실패:", e)


def save_debug(driver):
    save_state(driver, "final_debug")


# ==================================================
# 로그인 / 글쓰기 이동
# ==================================================

def login(driver):
    print("===== 로그인 시작 =====")

    user_id = os.environ.get("DC_ID")
    password = os.environ.get("DC_PASSWORD")

    if not user_id or not password:
        raise RuntimeError(
            "DC_ID 또는 DC_PASSWORD 환경변수가 설정되지 않았습니다."
        )

    driver.get(LOGIN_URL)

    wait = WebDriverWait(driver, 20)

    id_box = wait.until(
        EC.visibility_of_element_located((By.NAME, "user_id"))
    )

    pw_box = wait.until(
        EC.visibility_of_element_located((By.NAME, "pw"))
    )

    id_box.clear()
    id_box.send_keys(user_id)

    pw_box.clear()
    pw_box.send_keys(password)

    login_btn = wait.until(
        EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "button[type='submit']")
        )
    )

    login_btn.click()

    alert_text = read_alert(driver, timeout=3)

    if alert_text:
        print("⚠️ 로그인 alert:", alert_text)

    time.sleep(2)

    print("로그인 후:", driver.current_url)
    save_state(driver, "after_login")


def move_write_page(driver):
    print("===== 글쓰기 이동 =====")

    driver.get(GALLERY_URL)

    wait = WebDriverWait(driver, 20)

    # 상단·하단에 같은 링크가 있을 수 있으므로
    # 화면에 보이는 글쓰기 링크를 선택합니다.
    def find_write_link(d):
        links = d.find_elements(
            By.CSS_SELECTOR,
            "a[href*='/board/write']",
        )

        for link in links:
            try:
                if link.is_displayed() and link.is_enabled():
                    return link
            except StaleElementReferenceException:
                continue

        return False

    try:
        link = wait.until(find_write_link)

        print("글쓰기 발견:", link.get_attribute("href"))

        driver.execute_script(
            "arguments[0].scrollIntoView({block:'center'});",
            link,
        )

        link.click()

        alert_text = read_alert(driver, timeout=2)

        if alert_text:
            print("⚠️ 글쓰기 이동 alert:", alert_text)

        wait.until(
            EC.visibility_of_element_located((By.ID, "subject"))
        )

    except TimeoutException as e:
        save_state(driver, "write_page_failed")

        raise RuntimeError(
            "글쓰기 페이지로 이동하지 못했습니다. "
            "로그인 상태·글쓰기 권한·안내 메시지를 확인해 주세요."
        ) from e

    print("글쓰기 페이지 URL:", driver.current_url)


# ==================================================
# 글 작성
# ==================================================

def write_post(driver, title, content):
    print("===== 글 작성 =====")

    driver.switch_to.default_content()

    wait = WebDriverWait(driver, 20)

    subject = wait.until(
        EC.visibility_of_element_located((By.ID, "subject"))
    )

    subject.clear()
    subject.send_keys(title)

    if subject.get_attribute("value").strip() != title.strip():
        raise RuntimeError("제목이 정상적으로 입력되지 않았습니다.")

    print("제목 입력 완료")

    editor = wait.until(
        EC.visibility_of_element_located(
            (
                By.CSS_SELECTOR,
                ".note-editable[contenteditable='true']",
            )
        )
    )

    # 차트 내용의 특수문자가 HTML로 해석되지 않도록 처리
    content_html = html.escape(content).replace("\n", "<br>")

    result = driver.execute_script(
        """
        const editor = arguments[0];
        const contentHtml = arguments[1];

        const noteEditor = editor.closest('.note-editor');
        let source = null;
        let synced = false;

        if (window.jQuery && noteEditor) {
            const $ = window.jQuery;

            // Summernote 원본 요소를 인스턴스 정보로 탐색
            const sources = document.querySelectorAll(
                'textarea, .summernote'
            );

            for (const candidate of sources) {
                const instance = $(candidate).data('summernote');

                if (
                    instance &&
                    instance.layoutInfo &&
                    instance.layoutInfo.editor &&
                    instance.layoutInfo.editor[0] === noteEditor
                ) {
                    source = candidate;
                    break;
                }
            }
        }

        // 일반적인 Summernote DOM 배치도 확인
        if (!source && noteEditor) {
            const previous = noteEditor.previousElementSibling;

            if (
                previous &&
                previous.tagName.toLowerCase() === 'textarea'
            ) {
                source = previous;
            }
        }

        if (source && window.jQuery) {
            const $ = window.jQuery;

            if (
                typeof $.fn.summernote === 'function' &&
                $(source).data('summernote')
            ) {
                $(source).summernote('code', contentHtml);
                synced = true;
            }
        }

        editor.focus();
        editor.innerHTML = contentHtml;

        if (source && 'value' in source) {
            source.value = contentHtml;
            source.dispatchEvent(
                new Event('input', {bubbles: true})
            );
            source.dispatchEvent(
                new Event('change', {bubbles: true})
            );
        }

        editor.dispatchEvent(
            new Event('input', {bubbles: true})
        );
        editor.dispatchEvent(
            new Event('change', {bubbles: true})
        );
        editor.blur();

        return {
            text: editor.innerText || editor.textContent || '',
            sourceFound: Boolean(source),
            summernoteSynced: synced
        };
        """,
        editor,
        content_html,
    )

    actual_text = (result.get("text") or "").strip()

    print("본문 입력 글자 수:", len(actual_text))
    print("원본 입력 요소 발견:", result.get("sourceFound"))
    print("Summernote API 동기화:", result.get("summernoteSynced"))

    if not actual_text:
        raise RuntimeError("본문이 비어 있습니다. 에디터 입력에 실패했습니다.")

    if content.strip() not in actual_text:
        # 브라우저에 따라 줄바꿈 표현이 달라질 수 있어
        # 공백과 줄바꿈을 정규화하여 다시 비교합니다.
        expected = " ".join(content.split())
        actual = " ".join(actual_text.split())

        if expected not in actual:
            raise RuntimeError(
                "본문이 예상한 내용과 다르게 입력되었습니다."
            )

    print("본문 입력 완료")
    time.sleep(1)


# ==================================================
# 등록
# ==================================================

def submit_post(driver):
    print("===== 등록 버튼 검색 =====")

    driver.switch_to.default_content()

    before_url = driver.current_url
    alert_messages = []

    button_locator = (
        By.XPATH,
        "//button[normalize-space(.)='등록']"
        " | //input[(@type='submit' or @type='button')"
        " and normalize-space(@value)='등록']"
        " | //a[normalize-space(.)='등록']",
    )

    def find_ready_button(d):
        for button in d.find_elements(*button_locator):
            try:
                if not button.is_displayed():
                    continue

                if not button.is_enabled():
                    continue

                if button.get_attribute("disabled") is not None:
                    continue

                aria_disabled = (
                    button.get_attribute("aria-disabled") or ""
                )

                if aria_disabled.lower() == "true":
                    continue

                return button

            except StaleElementReferenceException:
                continue

        return False

    def print_candidates():
        buttons = driver.find_elements(*button_locator)

        print("등록 버튼 후보 수:", len(buttons))

        for index, button in enumerate(buttons, start=1):
            try:
                print(
                    f"후보 {index}:",
                    "태그 =", button.tag_name,
                    "| class =", button.get_attribute("class"),
                    "| 보임 =", button.is_displayed(),
                    "| 활성 =", button.is_enabled(),
                    "| disabled =",
                    button.get_attribute("disabled"),
                )

            except StaleElementReferenceException:
                print(f"후보 {index}: 요소가 교체되었습니다.")

    # 제목과 본문이 입력되어 있는지 제출 전 재확인
    subjects = driver.find_elements(By.ID, "subject")

    if subjects:
        subject_value = subjects[0].get_attribute("value") or ""

        if not subject_value.strip():
            raise RuntimeError(
                "제목이 비어 있어 등록을 중단했습니다."
            )

    editors = driver.find_elements(
        By.CSS_SELECTOR,
        ".note-editable[contenteditable='true']",
    )

    visible_editors = [
        editor for editor in editors if editor.is_displayed()
    ]

    if visible_editors:
        body_text = driver.execute_script(
            "return arguments[0].innerText || '';",
            visible_editors[0],
        )

        if not body_text.strip():
            raise RuntimeError(
                "본문이 비어 있어 등록을 중단했습니다."
            )

    # 페이지 하단으로 이동
    driver.execute_script(
        "window.scrollTo("
        "0, document.documentElement.scrollHeight"
        ");"
    )

    try:
        WebDriverWait(driver, 15).until(find_ready_button)

    except TimeoutException as e:
        print_candidates()
        save_state(driver, "submit_button_not_ready")

        raise RuntimeError(
            "화면에 보이고 활성화된 등록 버튼을 찾지 못했습니다. "
            "버튼 비활성화·필수 입력 누락 여부를 확인해 주세요."
        ) from e

    print_candidates()

    clicked = False
    last_error = None

    # 클릭 자체가 실패한 경우에만 재시도합니다.
    # 클릭이 정상 실행된 뒤에는 다시 누르지 않습니다.
    for attempt in range(1, 4):
        try:
            target = WebDriverWait(driver, 5).until(
                find_ready_button
            )

            driver.execute_script(
                "arguments[0].scrollIntoView("
                "{block:'center', inline:'nearest'}"
                ");",
                target,
            )

            time.sleep(0.5)

            target.click()

            clicked = True
            print(f"등록 버튼 일반 클릭 완료 ({attempt}차)")
            break

        except UnexpectedAlertPresentException:
            # 클릭 과정에서 알림이 발생했다면
            # 제출 여부가 불확실하므로 다시 클릭하지 않습니다.
            clicked = True
            print("클릭 중 알림 발생: 결과 확인으로 이동")
            break

        except (
            ElementClickInterceptedException,
            ElementNotInteractableException,
            StaleElementReferenceException,
            TimeoutException,
        ) as e:
            last_error = e

            print(
                f"클릭 시도 {attempt}/3 실패:",
                type(e).__name__,
                str(e)[:400],
            )

            time.sleep(1)

    if not clicked:
        save_state(driver, "submit_click_failed")

        raise RuntimeError(
            "등록 버튼은 찾았지만 클릭하지 못했습니다. "
            "팝업이나 로딩 화면이 버튼을 가리는지 확인해 주세요. "
            f"마지막 오류: {last_error}"
        ) from last_error

    # 알림 및 글 보기 화면 이동 확인
    deadline = time.monotonic() + 20

    while time.monotonic() < deadline:
        try:
            alert = driver.switch_to.alert
            message = alert.text

            alert_messages.append(message)
            print("⚠️ 등록 후 alert:", message)

            alert.accept()
            time.sleep(0.3)
            continue

        except NoAlertPresentException:
            pass

        try:
            current_url = driver.current_url

        except UnexpectedAlertPresentException:
            continue

        if "/board/view" in current_url:
            print("✅ 등록 성공:", current_url)
            save_state(driver, "after_submit")
            return current_url

        time.sleep(0.3)

    # 대기 종료 직전 발생한 알림도 확인
    final_alert = read_alert(driver, timeout=1)

    if final_alert:
        alert_messages.append(final_alert)
        print("⚠️ 마지막 alert:", final_alert)

    current_url = driver.current_url

    # 마지막 알림을 닫은 뒤 화면이 이동했을 수도 있음
    if "/board/view" in current_url:
        print("✅ 등록 성공:", current_url)
        save_state(driver, "after_submit")
        return current_url

    print("등록 전 URL:", before_url)
    print("등록 후 URL:", current_url)

    save_state(driver, "after_submit")

    messages = (
        " / ".join(alert_messages)
        if alert_messages
        else "없음"
    )

    raise RuntimeError(
        "등록 버튼은 클릭했지만 글 보기 화면으로 이동하지 않았습니다.\n"
        f"현재 URL: {current_url}\n"
        f"알림 내용: {messages}\n"
        "제목·본문·말머리 등 필수 입력과 화면 안내를 확인해 주세요. "
        "자동입력 방지 확인이 나오면 직접 처리해야 합니다. "
        "재실행 전 게시판에서 중복 등록 여부도 확인해 주세요."
    )


# ==================================================
# 실행
# ==================================================

def main():
    data = load_chart_data()

    title = make_title()
    content = make_content(data)

    print("\n===== 작성 제목 =====")
    print(title)

    print("\n===== 작성 내용 =====")
    print(content)

    driver = None

    try:
        driver = create_browser()

        login(driver)
        move_write_page(driver)
        write_post(driver, title, content)

        save_debug(driver)
        submit_post(driver)

    except Exception as e:
        print("❌ 오류:", e)

        if driver is not None:
            # 남아 있는 알림 때문에 상태 저장이 막히지 않도록 처리
            try:
                remaining_alert = read_alert(driver, timeout=1)

                if remaining_alert:
                    print("⚠️ 남아 있던 alert:", remaining_alert)

            except Exception as alert_error:
                print("알림 확인 실패:", alert_error)

            save_state(driver, "error_state")

        raise

    finally:
        if driver is not None:
            driver.quit()


if __name__ == "__main__":
    main()
