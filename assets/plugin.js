require(["gitbook"], function (gitbook) {

    gitbook.events.bind("start", function(_e, config) {
        window.disqusConfig = config['gitlab-disqus'];
    });

    gitbook.events.bind("page.change", async function(_e, config) {
        let page = gitbook.state;
        console.log('page----', page)
        window.disqusViewAll = false;
        initDisqus();
        await fetchCommentList();
        setTimeout(async () => {
            document.getElementById('gitlab-disqus-submit').onclick = createComment;
        }, 50);
    });

    let http = {};
    http.quest = function (option, callback) {
        let url = option.url;
        let method = option.method;
        let data = option.data;
        let timeout = option.timeout || 0;
        let xhr = new XMLHttpRequest();
        (timeout > 0) && (xhr.timeout = timeout);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status >= 200 && xhr.status < 400) {
                    let result = xhr.responseText;
                    try { result = JSON.parse(xhr.responseText); } catch (e) { }
                    callback && callback(null, result);
                } else {
                    callback && callback('status: ' + xhr.status);
                }
            }
        }.bind(this);
        xhr.open(method, url, true);
        if (typeof data === 'object') {
            try {
                data = JSON.stringify(data);
            } catch (e) { }
        }
        xhr.setRequestHeader("PRIVATE-TOKEN", window.disqusConfig.accessToken);
        if (method == 'post') {
            xhr.setRequestHeader("Content-Type", "application/json");
        }
        xhr.send(data);
        xhr.ontimeout = function () {
            callback && callback('timeout');
            console.log('%c连%c接%c超%c时', 'color:red', 'color:orange', 'color:purple', 'color:green');
        };
    };
    http.get = function (url, callback) {
        let option = url.url ? url : { url: url };
        option.method = 'get';
        this.quest(option, callback);
    };
    http.post = function (option, callback) {
        option.method = 'post';
        this.quest(option, callback);
    };

    const initDisqus = function() {
        if (!window.disqusConfig?.url) {
            throw new Error('missing gitlab url');
        }
        if (!window.disqusConfig?.accessToken) {
            throw new Error('missing gitlab accessToken');
        }
        if (!!document.getElementById("gitlab-disqus-container")) return;

        const disqusContent = `<div id="gitlab-disqus-container" class="plugin-gitlab-disqus-container">
                <div id="gitlab-disqus-commentTotal" class="plugin-gitlab-disqus-commentTotal"></div>
            <div class="plugin-gitlab-disqus-commentBarWrapper">
                <div class="plugin-gitlab-disqus-textAreaWrapper">
                    <textarea id="gitlab-disqus-textArea" class="plugin-gitlab-disqus-textArea"></textarea>
                    <div class="plugin-gitlab-disqus-commentBtnWrapper">
                        <div id="gitlab-disqus-submit" class="plugin-gitlab-disqus-commentBtn">comment</div>
                    </div>
                </div>
            </div>
            <div id="gitlab-disqus-commentListWrapper" class="plugin-gitlab-disqus-commentListWrapper"></div>
        </div>`

        const pageContent = document.getElementsByClassName('page-inner')[0];
        pageContent.innerHTML = pageContent.innerHTML + disqusContent;
    }

    function formatDate(time) {
        let date = new Date(time);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
        let Y = date.getFullYear() + '-';
        let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
        let D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ';
        let h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
        let m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
        let s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
        return Y + M + D + h + m + s;
    }

    async function viewAll() {
        window.disqusViewAll = true;
        await fetchCommentList();
    }

    async function fetchCommentList() {
        try {
            //普通get请求
            await http.get(window.disqusConfig.url, function (err, result) {
                if (!result || result.length == 0) return;
                // 这里对结果进行处理
                let avatarBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0BAMAAADP4xsBAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAhUExURUdwTOTl5+Xo6eXm6OTl5+Tl5+vr6+Xl5////+Pk5vLy8yPtgisAAAAIdFJOUwC/OFDlkxJ4iT4ZnQAABJNJREFUaN7NmztvE0EQx/0IdusgUrgzIgilsxAU7gJIQdclUCB3RqJxZyEo8g3WV3F+JLf3Cc73KfEjkRz75rEzN4iprZ9H/53Z3ZudqdVY1nr1++b0RbT4cHr27e2oVpm13txEfs8WZz+robfed/2RJV9HNuBK4E0AvIX3NeTXkUds8UUuxi9P2GehKI2uJy3pWZFl7CaLLFlMLjmc3WCTQzVpDX2ALUPi5J0Psk988ksfaM+55LYPtglT6G44OuHJfe4F9tFIDqYkEjmYkpx7oZGSNL3YqIS/laPvTdaQs5JDDXqJketeZR0E3dWhEzOnMbeHWvTSJDzwICFiOiucc3GxEsQ2kYi5e7A4PCUvUJfdniGOz0q3vIhLxtiLUWDkHZAxdidwEfNDdByykA2EnLojm4I/Pr7w/AiQA5XkKmT7yMvQMXsjaQc6jbg94Qd1Xo6OuaHdDXUadjthJ3kKoae8ZEfiw4HGi5FhuB6wIktmvuQwOuZkTV2iB6zI/j4ykOgBKzJnhV6Koad0+DVFUiNi97VSw+gOJ8tRtKNzvStbRUauN7xsFZFc79FSS9GPYo+FAYKs4x194ErRj4dvVD16QZ/lzsmi72Edn/nqvfbXW/SJhdeXxLanQM/JDxgxepuPLW+B9iPqxi5H94kAkUfINkTqNugOvoNo0HdE7CnQc+o7VLqp7u45XRt0QoS19ADbBXYD/xCVhvUmsNtW6AmeMdIrzi5niBpIKlzFTc6cePk6okWGSzwZhZfgh3S88GKxUanXl7OBFyuC6rHOdLIcKdRjfRUhS1mpKD42mwiJzmR6rNF01TCXLOJmf6LRmchpFjqwaBGEziROr2+UEaPmmAaHBxsdUtbaQ7NKpVmwHGvjofklxH10JGCzyAsumluu3Ufza/hZsaEXK+bPE+3zwP+L3imxbzlDloSxqZbvfDEFp/frAjxkCgp9K7/ixMQBNpBfnnD2HL8sEDd3lD1DrzgUGWX/wS5mmaNthVzM6ioywu4gl+CchY7hS3Bb5zTs9gT+4MiZ6BgstrSUToNuj8CPu5yNjsGqxVDpNOD2EvyQzgPQMfQhPRYVQsiL9h1UtEiD0FOgaPFMq0e5ItdQgcg5rSJ9oKyVBqJLYgQqxoWiY6A4PlDrUYKeA4XPLBR9rMglUK6tAH0NFJnTYPQUeCyIdFFdJvYCKui7cAMK+uPq0XfA40kmQK/KH08a1aN7wENVKkBPgVfBi6rRM+hRMBegY+BRsFk1ug89wKrRCfhs7JwysOfgY7ca3QGf6NXoHthYoEUv4XYILfoKbuLQovtw64kSfdiMM64OPUPafJQpM0Gak3ToBGup0u18V1gjWKaSuoe2r2lO9Hu86S5TON0hWgUz8clY2ir45BjLgr5lVnBQl501bPjTMlSf10yaFUWeI/+QF8Vheev+37fAGjbuWrYbGzZJW7Z2GzakW7bRGzb/W44sGA5aWI6HGA61WI7iWA4QGY491WrfQ8nsYS3LETPLwTjDcT7LIUTL0UnLgU/LMVXL4VrLkWDTQea1mY1fWw6Nm46670wwoP8XAaGV+ySbBOcAAAAASUVORK5CYII=";
                document.getElementById('gitlab-disqus-commentTotal').innerText = `${result.length} Comments`;
                if (result.length > 10 && !window.disqusViewAll) {
                    let commentListInnerText = result.slice(0, 10).map(comment => {
                        return `<div class="plugin-gitlab-disqus-commentItem">
                    <img class="plugin-gitlab-disqus-commentAvatar" src=${avatarBase64} />
                    <div class="plugin-gitlab-disqus-commentContent">
                        <div class="plugin-gitlab-disqus-userName">nickname</div>
                        <div class="plugin-gitlab-disqus-createDate">${formatDate(comment.created_at)}</div>
                        <div class="plugin-gitlab-disqus-commentText">${marked.parse(comment.body)}</div>
                    </div>
                </div>`
                    }).join('');
                    let viewAllInnerText = `<div class="viewAllWrapper">
                        <div id="gitlab-disqus-view-all" class="viewAllBtn">view all</div>
                    </div>`
                    document.getElementById('gitlab-disqus-commentListWrapper').innerHTML = commentListInnerText + viewAllInnerText;
                    setTimeout(() => {
                        document.getElementById('gitlab-disqus-view-all').onclick = viewAll;
                    }, 50);
                } else {
                    document.getElementById('gitlab-disqus-commentListWrapper').innerHTML = result.map(comment => {
                        return `<div class="plugin-gitlab-disqus-commentItem">
                    <img class="plugin-gitlab-disqus-commentAvatar" src=${avatarBase64} />
                    <div class="plugin-gitlab-disqus-commentContent">
                        <div class="plugin-gitlab-disqus-userName">nickname</div>
                        <div class="plugin-gitlab-disqus-createDate">${formatDate(comment.created_at)}</div>
                        <div class="plugin-gitlab-disqus-commentText">${marked.parse(comment.body)}</div>
                    </div>
                </div>`
                    }).join('');
                }
                console.log('Comment List get successfully:');
            });

        } catch (error) {
            console.error('Error get commentList:', error.response.data);
        }
    }

    async function createComment(event) {
        event.stopPropagation();
        let comment = document.getElementById('gitlab-disqus-textArea').value;
        if (!comment) return;
        try {
            //post请求
            await http.post({ url: window.disqusConfig.url, data: { body: comment}, timeout: 1000 }, async function (err, result) {
                // 这里对结果进行处理
                await fetchCommentList();
                document.getElementById('gitlab-disqus-textArea').value = '';
            });

        } catch (error) {
            console.error('Error creating comment:', error.response.data);
        }
    }
});