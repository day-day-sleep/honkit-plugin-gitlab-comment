const axios = require('axios');
import moment from 'moment';

require(["gitbook"], function(gitbook) {
    let pluginsConfig = {};
    const cfg = pluginsConfig.gitlabDisqus;
    var commentObj = {}
    Object.defineProperty(commentObj, 'inputValue', {
        configurable: true,
        get: function() {
            return document.getElementById('label-disqus-textArea').value
        },
        set: function(value) {
            document.getElementById('label-disqus-textArea').value = value
        }
    })

    const initDisqus = function() {
        if (!cfg.url) {
            throw new Error('missing gitlab url');
        }
        if (!cfg.accessToken) {
            throw new Error('missing gitlab accessToken');
        }

    }
    gitbook.events.bind("start", function(e, config) {
        pluginsConfig = config;
        initDisqus();
    });

    function utcToLocal(date) {
        const fmt = 'YYYY-MM-DD HH:mm:ss'
        return moment.utc(date).local().format(fmt)
    }

    async function fetchCommentList() {
        try {
            const response = await axios.get(
                url,
                { headers: { 'PRIVATE-TOKEN': cfg.accessToken }}
            );

            if (!!response.data) {
                //plugin-label-disqus-commentListWrapper
                //plugin-label-disqus-commentTotal
                document.getElementById('plugin-label-disqus-commentTotal').innerText = `${response.data.length} Comments`;
                document.getElementById('plugin-label-disqus-commentListWrapper').innerHTML = response.data.map(comment => {
                    return `<div class="plugin-label-disqus-commentItem">
                    <img class="plugin-label-disqus-commentAvatar" src="./avatar-default.png"/>
                    <div class="plugin-label-disqus-commentContent">
                        <div class="plugin-label-disqus-userName">nickname</div>
                        <div class="plugin-label-disqus-createDate">${utcToLocal(comment.created_at)}</div>
                        <div class="plugin-label-disqus-commentText">${comment.body}</div>
                    </div>
                </div>`
                }).join('');
            }
            console.log('Comment List get successfully:', response.data);
        } catch (error) {
            console.error('Error get commentList:', error.response.data);
        }
    }

    async function createComment(event, comment) {
        event.stopPropagation();
        if (!comment) return;
        try {
            const response = await axios.post(
                url,
                { body: comment },
                { headers: { 'PRIVATE-TOKEN': accessToken, "Content-Type": "application/json" }}
            );
            console.log('Comment created successfully:', response.data);
            await fetchCommentList();
            commentObj.inputValue = '';
        } catch (error) {
            console.error('Error creating comment:', error.response.data);
        }
    }


    document.getElementById('label-disqus-submit').addEventListener('keyup',async function(event) {
        await createComment(event, commentObj.inputValue);
    })

    document.onload = async function() {
        await fetchCommentList();
    }
});