const app = getApp();

Page({
    /**
     * 页面的初始数据
     */
    data: {
        movieId: '',
        backImage: 'background-image: url(/assets/imgs/backimage.webp)', // 模糊背景
        searchUrl: 'https://douban.uieee.com/v2/movie/subject/',
        // searchUrl: 'https://api.douban.com/v2/movie/subject/',
        movieInfo: {}
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onReady(options) {
        if (!app.globalData.movieId) {
            let movieIdTimer = setInterval(() => {
                if (app.globalData.movieId) {
                    this.setData({
                        movieId: app.globalData.movieId
                    });
                    clearInterval(movieIdTimer);
                    this.getMovieInfo();
                }
            }, 50);
        } else {
            this.setData({
                movieId: app.globalData.movieId
            });
            this.getMovieInfo();
        }
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
                this.setData({
                    movieInfo: res.data,
                    // backImage: `background-image: url('${res.data.images.medium}')`
                });
                console.log(res.data);
            }
        })
    }
})