module.exports = {
    book: {
        assets: './assets',
        css: [
            'plugin.css'
        ],
        js: [
            'plugin.js'
        ]
    },
    hooks: {
        'finish': function (page) {
            config = this.config.get("pluginsConfig.label-disqus")
            console.log('config', config)
            if(config === undefined) return page

            const disqusContent = `<div class="plugin-label-disqus-container">
                <div class="plugin-label-disqus-commentTotal"></div>
            <div class="plugin-label-disqus-commentBarWrapper">
                <div class="plugin-label-disqus-textAreaWrapper">
                    <textarea id="label-disqus-textArea" class="plugin-label-disqus-textArea"></textarea>
                    <div class="plugin-label-disqus-commentBtnWrapper">
                        <div id="label-disqus-submit" class="plugin-label-disqus-commentBtn">comment</div>
                    </div>
                </div>
            </div>
            <div class="plugin-label-disqus-commentListWrapper"></div>
        </div>`

            page.content = page.content + disqusContent;
            return page;
        }
    }
};