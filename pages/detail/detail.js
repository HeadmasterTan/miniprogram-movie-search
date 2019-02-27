const app = getApp();

Page({
    /**
     * 页面的初始数据
     */
    data: {
        movieId: '',
        searchUrl: 'https://douban.uieee.com/v2/movie/subject/',
        movieInfo: {},
        reviews: [], // 长评论

        backImage: '', // 背景
        directors: '', // 导演列表
        casts: '', // 主演列表
        tags: '', // 类型列表

        windowSize: '',
        showReview: [false, false, false, false, false, false, false, false, false, false], // 是否显示长评论全部内容
        pageLoading: false, // 页面加载中
        allowScroll: true, // 允许纵向滚动
        footerDesc: '没了哟 (～￣▽￣)～ ', // 页脚描述
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onReady(options) {
        wx.showLoading({
            mask: true,
            title: '加载中(●—●)'
        });
        this.setData({
            pageLoading: true
        });
        if (!app.globalData.movieId) {
            let movieIdTimer = setInterval(() => {
                if (app.globalData.movieId) {
                    this.setData({
                        movieId: app.globalData.movieId,
                        windowSize: app.globalData.windowSize
                    });
                    clearInterval(movieIdTimer);
                    this.getMovieInfo();
                }
            }, 50);
        } else {
            this.setData({
                movieId: app.globalData.movieId,
                windowSize: app.globalData.windowSize
            });
            this.getMovieInfo();
            this.getReviewsList();
        }
    },
    /**
     * 监听分享
     */
    onShareAppMessage(res) {
        return {
            title: this.data.movieInfo.title
        };
    },
    /**
     * 获取电影信息
     */
    getMovieInfo() {
        wx.request({
            url: this.data.searchUrl + this.data.movieId,
            header: {
                'content-type': 'application/xml'
            },
            method: 'GET',
            dataType: 'json',
            responseType: 'text',
            success: res => {
                if (res.statusCode != 200) {
                    this.requestFail();
                    return;
                }
                this.setData({
                    movieInfo: res.data,
                    directors: res.data.directors.map(item => item.name).join(' / '),
                    backImage: `background-image: url('${res.data.images.medium}')`,
                    casts: res.data.casts.map(item => item.name).join(' / '),
                    tags: res.data.genres.join(' / '),
                });

                wx.hideLoading();
                this.setData({
                    pageLoading: false
                });
            }
        });
    },
    /**
     * 获取影片的长评论
     */
    getReviewsList() {
        this.setData({
            footerDesc: '别急，让我找找...'
        });
        wx.request({
            url: this.data.searchUrl + this.data.movieId + '/reviews?count=10',
            header: {
                'content-type': 'application/xml'
            },
            method: 'GET',
            dataType: 'json',
            responseType: 'text',
            success: res => {
                this.setData({
                    reviews: res.data.reviews,
                    footerDesc: '没了哟 (～￣▽￣)～ '
                });
            }
        });
    },
    /**
     * 请求失败
     */
    requestFail() {
        let minute = 60 - (new Date()).getMinutes();
        wx.showModal({
            title: '非常抱歉',
            content: `渣渣程序本小时的查询次数已经用完了，请${minute}分钟后再来吧o(╥﹏╥)o`,
            showCancel: false,
            confirmText: '好的吧'
        });
    },
    /**
     * 图片预览
     */
    previewImage(ref, urls) {
        let params = {
            current: ref.currentTarget.dataset.url, // 当前显示图片的http链接
            urls // 需要预览的图片http链接列表
        };

        wx.previewImage({
            current: params.current,
            urls: params.urls,
            fail: (res) => {
                wx.showModal({
                    title: '预览失败',
                    content: '(￣□￣；)很抱歉，系统出问题了，要不再试试？',
                    showCancel: false,
                    confirmText: '确定'
                });
            }
        });
    },
    /**
     * 预览导演 / 主演图片
     */
    previewDirectorCasts(ref) {
        let urls = [].concat(this.data.movieInfo.directors.map(item => item.avatars.large));
        urls = urls.concat(this.data.movieInfo.casts.map(item => item.avatars.large));
        
        this.previewImage(ref, urls);
    },
    /**
     * 预览剧照
     */
    previewPhoto(ref) {
        let urls = [].concat(this.data.movieInfo.photos.map(item => item.image));

        this.previewImage(ref, urls);
    },
    /**
     * 预览编剧图片
     */
    previewWriter(ref) {
        let urls = [].concat(this.data.movieInfo.writers.map(item => item.avatars.large));

        this.previewImage(ref, urls);
    },
    /**
     * 显示长评论内容
     */
    showReviewContent(ref) {
        let index = ref.currentTarget.dataset.index;
        let temp = this.data.showReview.map(item => false);
        temp[index] = true;
        this.setData({
            showReview: temp,
            allowScroll: false,
        });
    },
    /**
     * 关闭评论浏览
     */
    closeShowReview(event) {
        let temp = this.data.showReview.map(item => false);
        this.setData({
            showReview: temp,
            allowScroll: true,
        });
    }
})