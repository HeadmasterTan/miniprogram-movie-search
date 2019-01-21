const app = getApp();

// 引入腾讯地图SDK核心类
const QQMapWX = require('../../libs/qqmap-wx-jssdk.min.js');
// 实例化API核心类
const qqmapsdk = new QQMapWX({
    key: 'MWLBZ-3BVWQ-2PO5W-GDVPN-CRMF7-UXF7Y' // 必填
});

Page({
    data: {
        // 查询参数
        city: '', // 查询城市
        start: 0, // 开始下标
        count: [20, 20], // 查询条数

        curList: 0, // 选中项 0 热映 1 top250
        curUrl: 'in_theaters', // 当前查询的地址
        noMoreMovie: false, // 没有更多电影啦
        noMoreDesc: '别急，让我找找...', // 没有更多电影的底部描述

        // 查询地址
        urlPrefix: 'https://douban.uieee.com/v2/movie/',
        hotMovieUrl: 'in_theaters', // 热映电影
        top250Url: 'top250', // 最热前250

        deviceInfo: {}, // 设备信息
        windowSize: '', // 设备窗口大小

        menuList: ['正在热映', '豆瓣排行'], // 菜单
        cityList: [], // 城市列表
        movies: [], // 电影列表，每一个菜单对应一个列表
        // api返回的单个数据展示，这个东西是拿来看的，不是拿来用的
        // movie: {
        //     alt: '', // 地址
        //     casts: [{ // 演员列表
        //         alt: '', // 地址
        //         avatars: [{ // 头像
        //             large: '', // 大头像
        //             medium: '', // 中等头像
        //             small: '' // 小头像
        //         }],
        //         id: '',
        //         name: '' // 名字
        //     }],
        //     collect_count: 0, // unknown
        //     directors: [{ // 导演列表
        //         alt: '', // 地址
        //         avatars: [{ // 头像列表
        //             large: '', // 大头像
        //             medium: '', // 中等头像
        //             small: '' // 小头像
        //         }],
        //         id: '',
        //         name: '' // 名字
        //     }],
        //     genres: [], // 类型 String
        //     id: '',
        //     images: [{ // 海报列表
        //         large: '', // 大头像
        //         medium: '', // 中等头像
        //         small: '' // 小头像
        //     }],
        //     original_title: '', // 原名
        //     rating: { // 评分
        //         average: 0, // 得分
        //         max: 10, // 最高
        //         min: 0, // 最低
        //         stars: 0
        //     },
        //     subtype: '', // 类型
        //     title: '', // 标题
        //     year: 2018
        // }
    },
    /**
     * 页面数据初始化
     */
    onLoad() {
        // 一个菜单一个列表
        let movies = this.data.menuList.map(item => []);
        this.setData({
            movies
        })
        this.getSystemInfo();
        this.getCityList();
        this.getNowCity();
    },
    /**
     * 获取设备信息
     */
    getSystemInfo() {
        wx.getSystemInfo({
            success: res => {
                this.setData({
                    deviceInfo: res,
                    windowSize: `width:${res.windowWidth}px;height:${res.windowHeight}px`
                });
                app.globalData.windowSize = this.data.windowSize;
            }
        });
    },
    /**
     * 获取全国全部城市列表
     */
    getCityList() {
        qqmapsdk.getCityList({
            success: res => {
                this.setData({
                    cityList: res.result[1]
                });
            }
        });
    },
    /**
     * 获取当前城市
     */
    getNowCity() {
        wx.getLocation({
            type: 'gcj02',
            success: res => {
                const location = {
                    latitude: res.latitude,
                    longitude: res.longitude
                };
                // 地址解析，将经纬度解析为所在城市
                qqmapsdk.reverseGeocoder({
                    location,
                    success: res => {
                        this.setData({
                            city: res.result.ad_info.city.split('市')[0]
                        });
                        // 拿到地址信息再请求
                        this.getMovies();
                    }
                });
            }
        });
    },
    /**
     * 根据url，请求参数获取电影列表
     */
    getMovies() {
        if (!this.data.noMoreMovie) { // 没有更多电影了，那就不再请求了
            const curList = this.data.curList;
            const url = this.data.urlPrefix + this.data.curUrl;
            const data = {
                city: this.data.city,
                start: this.data.start,
                count: this.data.count[curList]
            };
            // 豆瓣电影API返回的电影不是按照排序返回的，请求前10个之后，再请求10个，后一次取到的可能会跟前面10个重复，但是一次性取20个却不会重复，需要去重
            wx.request({
                url,
                data,
                header: {
                    'content-type': 'application/xml'
                },
                method: 'GET',
                dataType: 'json',
                responseType: 'text',
                success: res => {
                    if (res.data.subjects.length === this.data.movies[curList].length) { // 再也请求不到数据了就显示没有了
                        this.setData({
                            noMoreMovie: true,
                            noMoreDesc: '再也找不到了o(╥﹏╥)o'
                        });
                        return;
                    }
                    this.setData({
                        noMoreMovie: false
                    });
                    res.data.subjects.forEach(item => {
                        item.castsStr = item.casts.length > 0 ? item.casts.map(cast => cast.name).join('，') : '(未公开)';
                        item.genresStr = item.genres.length > 0 ? item.genres.join('，') : '(未知)';
                    });

                    // 将返回的电影列表重新排序，新获取到的排到最后面
                    let movies = res.data.subjects;
                    let supMovies = [];
                    for (let i = 0; i < movies.length; i++) {
                        let index = 0;
                        for (let j = 0; j < this.data.movies[curList].length; j++) {
                            if (movies[i].id === this.data.movies[curList][j].id) {
                                index = 1;
                                break;
                            }
                        }
                        if (index === 0) {
                            supMovies.push(movies[i]);
                        }
                    }

                    // 拼接电影列表
                    let movieList = [].concat(this.data.movies);
                    movieList[curList] = movieList[curList].concat(supMovies);
                    console.log(movieList);
                    this.setData({
                        movies: movieList
                    });
                },
                fail: res => {},
                complete: res => {}
            });
        }
    },
    /**
     * 切换列表类型
     */
    changeList(e) {
        this.setData({
            curList: e.target.dataset.item,
            noMoreMovie: false,
            noMoreDesc: '别急，让我找找...'
        });
        const curList = this.data.curList;
        // 切换当前请求URL
        if (curList === 0) {
            this.setData({
                curUrl: this.data.hotMovieUrl
            });
        } else if (curList === 1) {
            this.setData({
                curUrl: this.data.top250Url
            });
        }
        if (this.data.movies[curList].length === 0) {
            this.getMovies();
        }
    },
    /**
     * 加载更多的电影
     */
    loadMoreMovie() {
        // 正确来说是改变 start 的值，但是豆瓣API返回的数据是乱序的，为了不扰乱前面的数据排序，所以决定将新拿到的数据都往后排
        // 这样会导致一个问题，那就是评分排序是乱的
        let counts = [].concat(this.data.count);
        counts[this.data.curList] = counts[this.data.curList] + 20;
        this.setData({
            count: counts
        });
        this.getMovies();
    },
    /**
     * 切换为搜索
     */
    toggleSearch() {
        wx.navigateTo({
            url: '../search/search',
            success: res => {}
        })
    },
    /**
     * 选择城市
     */
    chooseCity() {
        wx.showModal({
            title: '温馨提示',
            content: '功能施工中...',
            showCancel: false,
            confirmText: '我知道了'
        });
    }
})