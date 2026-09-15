import time
import os
import requests

from datetime import datetime
from zoneinfo import ZoneInfo

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


LOGIN_URL = "https://sign.dcinside.com/login"

GALLERY_URL = (
    "https://gall.dcinside.com/mgallery/board/lists?id=gdpeaceminusone"
)


# 음총 사이트 chart-data.json
CHART_URL = "https://gdstream.site/chart-data.json"


# 차트 표시 순서
CHART_ORDER = [
    "melonTop100",
    "melonDaily",
    "genieTop200",
    "bugsRealtime"
]



def load_chart_data():

    print("===== 음총 차트 데이터 가져오기 =====")


    try:

        response = requests.get(
            CHART_URL,
            params={
                "v": int(time.time())
            },
            headers={
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
                "User-Agent": "Mozilla/5.0"
            },
            timeout=20
        )


        response.raise_for_status()


        data = response.json()


        print(
            "차트 기준시간:",
            data.get("updatedAt")
        )


        return data


    except Exception as e:

        print(
            "차트 데이터 가져오기 실패:",
            e
        )

        raise



def make_title():

    now = datetime.now(
        ZoneInfo("Asia/Seoul")
    )

    return (
        f"[음원차트] {now.strftime('%m/%d %H:%M')} 업데이트"
    )



def make_content(data):

    text = ""

    text += (
        "📊 G-DRAGON / BIGBANG 음원 차트 현황\n\n"
    )


    text += (
        f"기준시간 : {data.get('updatedAt','')}\n\n"
    )


    charts = data.get(
        "charts",
        {}
    )


    for chart_id in CHART_ORDER:

        chart = charts.get(
            chart_id
        )


        if not chart:
            continue


        text += (
            f"【{chart.get('name','')}】\n"
        )


        songs = chart.get(
            "songs",
            []
        )


        if not songs:

            text += (
                "차트인 없음\n\n"
            )

            continue



        for song in songs:

            text += (
                f"{song.get('rank','')}위 "
                f"{song.get('artist','')} - "
                f"{song.get('title','')} "
                f"{song.get('change',{}).get('label','')}\n"
            )


        text += "\n"



    text += (
        "※ 매시간 자동 업데이트"
    )


    return text



def create_browser():

    options = Options()


    options.add_argument(
        "--headless=new"
    )

    options.add_argument(
        "--no-sandbox"
    )

    options.add_argument(
        "--disable-dev-shm-usage"
    )

    options.add_argument(
        "--window-size=1920,1080"
    )

    options.add_argument(
        "--disable-blink-features=AutomationControlled"
    )


    options.add_argument(
        "--disable-gpu"
    )


    options.add_argument(
        "--remote-debugging-port=9222"
    )


    options.add_argument(
        "--user-agent="
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    )


    driver = webdriver.Chrome(
        options=options
    )


    return driver



def login(driver):

    print("===== 로그인 시작 =====")


    driver.get(
        LOGIN_URL
    )


    wait = WebDriverWait(
        driver,
        20
    )


    id_box = wait.until(
        EC.presence_of_element_located(
            (
                By.NAME,
                "user_id"
            )
        )
    )


    pw_box = wait.until(
        EC.presence_of_element_located(
            (
                By.NAME,
                "pw"
            )
        )
    )


    id_box.send_keys(
        os.environ["DC_ID"]
    )


    pw_box.send_keys(
        os.environ["DC_PASSWORD"]
    )


    login_btn = wait.until(
        EC.element_to_be_clickable(
            (
                By.CSS_SELECTOR,
                "button[type='submit']"
            )
        )
    )


    login_btn.click()


    time.sleep(5)


    print(
        "로그인 후:",
        driver.current_url
    )



def move_write_page(driver):

    print("===== 글쓰기 이동 =====")


    driver.get(
        GALLERY_URL
    )


    time.sleep(5)


    links = driver.find_elements(
        By.TAG_NAME,
        "a"
    )


    for link in links:

        text = link.text.strip()

        href = link.get_attribute(
            "href"
        )


        if (
            "글쓰기" in text
            or "write" in str(href)
        ):


            print(
                "글쓰기 발견:",
                href
            )


            driver.execute_script(
                "arguments[0].click();",
                link
            )


            time.sleep(5)


            return



    raise Exception(
        "글쓰기 버튼 못찾음"
    )



def write_post(driver, title, content):

    print("===== 글 작성 =====")


    wait = WebDriverWait(
        driver,
        20
    )


    subject = wait.until(
        EC.presence_of_element_located(
            (
                By.ID,
                "subject"
            )
        )
    )


    subject.send_keys(
        title
    )


    print(
        "제목 입력 완료"
    )



    editor = wait.until(
        EC.presence_of_element_located(
            (
                By.CSS_SELECTOR,
                ".note-editable[contenteditable='true']"
            )
        )
    )


    driver.execute_script(
        """
        arguments[0].innerHTML = arguments[1];
        arguments[0].dispatchEvent(
            new Event('input',{bubbles:true})
        );
        """,
        editor,
        content.replace(
            "\n",
            "<br>"
        )
    )


    print(
        "본문 입력 완료"
    )


    time.sleep(3)



def submit_post(driver):

    print("===== 등록 버튼 검색 =====")


    buttons = driver.find_elements(
        By.TAG_NAME,
        "button"
    )


    for btn in buttons:

        if btn.text.strip() == "등록":


            print(
                "등록 버튼 발견"
            )


            driver.execute_script(
                "arguments[0].click();",
                btn
            )


            time.sleep(5)


            print(
                "등록 완료 URL:",
                driver.current_url
            )


            return



    raise Exception(
        "등록 버튼 못찾음"
    )



def save_debug(driver):

    with open(
        "final_debug.html",
        "w",
        encoding="utf-8"
    ) as f:

        f.write(
            driver.page_source
        )


    print(
        "final_debug.html 저장"
    )



def main():

    data = load_chart_data()


    title = make_title()


    content = make_content(
        data
    )


    print("\n===== 작성 내용 =====")
    print(content)


    driver = create_browser()


    try:

        login(driver)

        move_write_page(driver)

        write_post(
            driver,
            title,
            content
        )

        save_debug(driver)

        submit_post(driver)


    finally:

        driver.quit()



if __name__ == "__main__":

    main()
