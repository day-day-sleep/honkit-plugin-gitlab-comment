require(["gitbook"], function (gitbook) {

    gitbook.events.bind("start", function(_e, config) {
        window.commentConfig = config['gitlab-comment'];
    });

    gitbook.events.bind("page.change", async function(_e, config) {
        let page = gitbook.state;
        console.log('page----', page)
        window.commentViewAll = false;
        initComments();
        await fetchCommentList();
        setTimeout(async () => {
            document.getElementById('gitlab-comment-submit').onclick = createComment;
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
        xhr.setRequestHeader("PRIVATE-TOKEN", window.commentConfig.accessToken);
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

    const initComments = function() {
        if (!window.commentConfig?.url) {
            throw new Error('missing gitlab url');
        }
        if (!window.commentConfig?.accessToken) {
            throw new Error('missing gitlab accessToken');
        }
        if (!!document.getElementById("gitlab-comment-container")) return;

        const commentContent = `<div id="gitlab-comment-container" class="plugin-gitlab-comment-container">
                <div id="gitlab-comment-commentTotal" class="plugin-gitlab-comment-commentTotal"></div>
            <div class="plugin-gitlab-comment-commentBarWrapper">
                <div class="plugin-gitlab-comment-textAreaWrapper">
                    <textarea id="gitlab-comment-textArea" class="plugin-gitlab-comment-textArea"></textarea>
                    <div class="plugin-gitlab-comment-commentBtnWrapper">
                        <div id="gitlab-comment-submit" class="plugin-gitlab-comment-commentBtn">comment</div>
                    </div>
                </div>
            </div>
            <div id="gitlab-comment-commentListWrapper" class="plugin-gitlab-comment-commentListWrapper"></div>
        </div>`

        const pageContent = document.getElementsByClassName('page-inner')[0];
        pageContent.insertAdjacentHTML('beforeend' ,commentContent);
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
        window.commentViewAll = true;
        await fetchCommentList();
    }

    async function fetchCommentList() {
        let markdownReg = /(?<!!)\[(.*?)\]\((.*?)\)/;
        let titleReg = /(?<!!)\[(.*?)\]/;

        try {
            //普通get请求
            await http.get(window.commentConfig.url, function (err, result) {
                if (!result || result.length == 0) return;
                let pageInfo = gitbook.state;
                let pageTitle = pageInfo.page.title;
                result = result.filter(comment => !!comment.body.match(titleReg) && comment.body.match(titleReg)[1] == pageTitle);

                // 这里对结果进行处理
                document.getElementById('gitlab-comment-commentTotal').innerText = `${result.length} Comments`;
                if (result.length > 10 && !window.commentViewAll) {
                    let commentListInnerText = result.slice(0, 10).map(comment => {
                        return `<div class="plugin-gitlab-comment-commentItem">
                    <div class="plugin-gitlab-comment-commentContent">
                        <div class="plugin-gitlab-comment-createDate">${formatDate(comment.created_at)}</div>
                        <div class="plugin-gitlab-comment-commentText">${marked.parse(comment.body.replace(markdownReg, '').replace(' ', ''))}</div>
                    </div>
                </div>`
                    }).join('');
                    let viewAllInnerText = `<div class="viewAllWrapper">
                        <div id="gitlab-comment-view-all" class="viewAllBtn">view all</div>
                    </div>`
                    document.getElementById('gitlab-comment-commentListWrapper').innerHTML = commentListInnerText + viewAllInnerText;
                    setTimeout(() => {
                        document.getElementById('gitlab-comment-view-all').onclick = viewAll;
                    }, 50);
                } else {
                    document.getElementById('gitlab-comment-commentListWrapper').innerHTML = result.map(comment => {
                        return `<div class="plugin-gitlab-comment-commentItem">
                    <div class="plugin-gitlab-comment-commentContent">
                        <div class="plugin-gitlab-comment-createDate">${formatDate(comment.created_at)}</div>
                        <div class="plugin-gitlab-comment-commentText">${marked.parse(comment.body.replace(markdownReg, '').replace(' ', ''))}</div>
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
        let comment = document.getElementById('gitlab-comment-textArea').value;
        if (!comment) return;
        let pageInfo = gitbook.state;
        let bodyText = `[${pageInfo.page.title}](${window.location.href}) ${comment}`;

        try {
            //post请求
            await http.post({ url: window.commentConfig.url, data: { body: bodyText}, timeout: 1000 }, async function (err, result) {
                // 这里对结果进行处理
                await fetchCommentList();
                document.getElementById('gitlab-comment-textArea').value = '';
            });

        } catch (error) {
            console.error('Error creating comment:', error.response.data);
        }
    }
});