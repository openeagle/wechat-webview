require('./polyfills/url-search-params-polyfill')

const commontData = {
  events: undefined,
}

Component({
  properties: {
    src: {
      type: String,
      observer() {
        this.setData({
          url: this.getUrl(),
        })
      },
    },
    options: {
      type: Object,
    },
  },
  data: {
    url: '',
  },
  created() {
    this.pageShow = true
    this.eventChannel = null
  },
  pageLifetimes: {
    hide() {
      this.pageShow = false
    },
    show() {
      /**
       * 页面被展示
       * 保证页面有 hide 过才执行该逻辑
       * */
      if (this.pageShow === true) {
        return
      } else {
        this.pageShow = true
      }
      let url = this.data.url
      url = this.getUrl(commontData.events)
      commontData.events = undefined
      url = this.changeURLParames(url, [
        {
          type: 'hash',
          key: 'showing',
          value: Date.now().toString(),
        },
      ])
      this.setData({
        url,
      })
    },
  },
  lifetimes: {
    attached: function () {
      this.setData({
        url: this.getUrl(),
      })
      const pages = getCurrentPages()
      const eventChannel = pages[pages.length - 1].getOpenerEventChannel()
      this.eventChannel = eventChannel
      eventChannel.on('events', (e) => {
        if (e && e.data) {
          commontData.events = e.data
        }
      })
    },
  },
  methods: {
    // url里添加参数
    changeURLParames(url, params) {
      let queryStr = ''
      if (url.indexOf('?') > -1) {
        queryStr = url.substring(
          url.indexOf('?') + 1,
          url.indexOf('#') > -1 ? url.indexOf('#') : url.length
        )
      }
      const hashStr = url.split('#')[1] || ''
      const queryParams = new global.URLSearchParams(queryStr)
      const hashParams = new global.URLSearchParams(hashStr)
      for (const i in params) {
        const item = params[i]
        if (item.type === 'query') {
          queryParams.set(item.key, item.value)
        }
        if (item.type === 'hash') {
          hashParams.set(item.key, item.value)
        }
      }
      queryParams.sort()
      hashParams.sort()

      return `${
        (url.split('#')[0] || '').split('?')[0]
      }?${queryParams}#${hashParams}`
    },

    getUrl(events) {
      const hash = JSON.stringify(
        Object.assign(this.data.options, {
          events,
        })
      )

      const url = this.changeURLParames(this.data.src, [
        {
          type: 'query',
          key: '__version__',
          value: (this.data.options && this.data.options.version) || '',
        },
        {
          type: 'hash',
          key: '',
          value: hash,
        },
      ])
      return url
    },

    handleMesage(event) {
      if (event.detail.data) {
        this.eventChannel?.emit('events', event.detail.data)
      }
      this.triggerEvent('message', event)
    },
  },
})
