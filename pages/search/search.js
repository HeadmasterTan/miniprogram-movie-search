const app = getApp();

Page({
    /**
     * 页面的初始数据
     */
    data: {
        windowSize: '', // 设备窗口大小

        // 查询参数
        searchKey: '', // 查询关键字
        start: 0, // 开始下标
        count: 20, // 查询条数
        searchUrl: 'https://douban.uieee.com/v2/movie/search', // 电影查询URL
        delaySearch: null, // 延迟搜索
        noMoreDesc: '随便搜点啥呗~', // 没有更多电影的底部描述
        
        movies: [], // 电影列表
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        this.getSystemInfo();
    },
    /**
     * 获取设备信息
     */
    getSystemInfo() {
        wx.getSystemInfo({
            success: res => {
                this.setData({
                    windowSize: `width:${res.windowWidth}px;height:${res.windowHeight}px`
                });
            }
        });
    },
    /**
     * 查询电影
     */
    getMovies() {
        const data = {
            q: this.data.searchKey,
            start: this.data.start,
            count: this.data.count
        };
        wx.request({
            url: this.data.searchUrl,
            data,
            header: {
                'content-type': 'application/xml'
            },
            method: 'GET',
            dataType: 'json',
            responseType: 'text',
            success: res => {
                res.data.subjects.forEach(item => {
                    item.castsStr = item.casts.length > 0 ? item.casts.map(cast => cast.name).join('，') : '(未公开)';
                    item.genresStr = item.genres.length > 0 ? item.genres.join('，') : '(未知)';
                });

                // 将返回的电影列表重新排序，新获取到的排到最后面
                let movies = res.data.subjects;
                let supMovies = [];
                for (let i = 0; i < movies.length; i++) {
                    let index = 0;
                    for (let j = 0; j < this.data.movies.length; j++) {
                        if (movies[i].id === this.data.movies[j].id) {
                            index = 1;
                            break;
                        }
                    }
                    if (index === 0) {
                        supMovies.push(movies[i]);
                    }
                }

                this.setData({
                    movies: this.data.movies.concat(supMovies)
                });

                if (supMovies.length === 0 || this.data.movies.length < 20) {
                    this.setData({
                        noMoreDesc: '再也找不到了o(╥﹏╥)o'
                    });
                } else {
                    this.setData({
                        noMoreDesc: '别急，让我找找...'
                    });
                }
            },
            fail: res => {},
            complete: res => {}
        });
    },
    /**
     * 查询电影
     */
    searchMovie(e) {
        // 不知道为什么blur也会触发input事件？
        if (e.detail.value && e.detail.value === this.data.searchKey) {
            return;
        }
        this.setData({
            searchKey: e.detail.value,
            start: 0,
            noMoreDesc: '别急，让我找找...',
            movies: []
        });

        if (e.detail.value) {
            clearTimeout(this.data.delaySearch);
            this.setData({
                delaySearch: setTimeout(() => {
                    this.getMovies();
                }, 200)
            });
        } else {
            this.setData({
                noMoreDesc: '随便搜点啥呗~'
            });
        }
    },
    /**
     * 加载更多电影
     */
    loadMoreMovie() {
        // 有所不同的是，这个 api count 上限是20
        this.setData({
            start: this.data.start + 20
        });
        this.getMovies();
    },
    /**
     * 返回上一页
     */
    navigateBack() {
        wx.navigateBack({
            delta: 1
        });
    }
})