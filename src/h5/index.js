const config = {
  shouldRefresh() {
    return false
  },
}

/**
 * 用于存储页面跳转回来后新的配置（页面跳转回来后会传递新的配置，这时需要返回前一个 hash，如果用户信息有变化，会自动刷新页面，所以需要存储新的 hash 配置）
 */
export const HASH_TEMP_KEY = 'openeagle.wechat-webview.hash.temp'
/**
 * 用于存储页面配置缓存（避免 location 刷新或跳转导致的丢失）
 */
export const HASH_CACHE_KEY = 'openeagle.wechat-webview.hash.cache'

function getQueryConfig() {
  let hash = window.sessionStorage.getItem(HASH_TEMP_KEY)
  if (hash) {
    window.sessionStorage.removeItem(HASH_TEMP_KEY)
  } else {
    hash = decodeURIComponent(location.hash.substring(1))
    if (!hash) {
      hash = window.sessionStorage.getItem(HASH_CACHE_KEY) || ''
    }
  }
  if (hash) {
    window.sessionStorage.setItem(HASH_CACHE_KEY, hash)
  }
  try {
    return hash ? JSON.parse(hash) : {}
  } catch (err) {
    return {}
  }
}

// 应用显示监听器数组
const appShowListeners = []
// 应用隐藏兼容数组
const appHideListeners = []
// 页面显示监听器数组
const pageShowListeners = []
// 页面隐藏兼容数组
const pageHideListeners = []
const onAppShow = function (callback) {
  if (appShowListeners.indexOf(callback) < 0) {
    appShowListeners.push(callback)
  }
}
const offAppShow = function (callback) {
  const matchedIndex = appShowListeners.indexOf(callback)
  if (matchedIndex >= 0) {
    appShowListeners.splice(matchedIndex, 1)
  }
}
const onAppHide = function (callback) {
  if (appHideListeners.indexOf(callback) < 0) {
    appHideListeners.push(callback)
  }
}
const offAppHide = function (callback) {
  const matchedIndex = appHideListeners.indexOf(callback)
  if (matchedIndex >= 0) {
    appHideListeners.splice(matchedIndex, 1)
  }
}
const onPageShow = function (callback) {
  if (pageShowListeners.indexOf(callback) < 0) {
    pageShowListeners.push(callback)
  }
}
const offPageShow = function (callback) {
  const matchedIndex = pageShowListeners.indexOf(callback)
  if (matchedIndex >= 0) {
    pageShowListeners.splice(matchedIndex, 1)
  }
}
const onPageHide = function (callback) {
  if (pageHideListeners.indexOf(callback) < 0) {
    pageHideListeners.push(callback)
  }
}
const offPageHide = function (callback) {
  const matchedIndex = pageHideListeners.indexOf(callback)
  if (matchedIndex >= 0) {
    pageHideListeners.splice(matchedIndex, 1)
  }
}

let currentEvents = {}
const currentEventChannel = {
  emit(key, message) {
    wx.miniProgram.postMessage({
      data: { key, message },
    })
  },
  on(key, callback) {
    throw new Error('not support')
  },
}
function getOpenerEventChannel() {
  return currentEventChannel
}

function callWhenWeixinJSBridgeReady(callback) {
  if (typeof WeixinJSBridge !== 'undefined') {
    callback()
  } else {
    document.addEventListener('WeixinJSBridgeReady', callback, false)
  }
}

let launchOptions
let enterOptions
function getLaunchOptions() {
  return launchOptions
}
function getEnterOptions() {
  return enterOptions
}

function setup() {
  // 查询参数
  launchOptions = getQueryConfig()
  enterOptions = launchOptions

  callWhenWeixinJSBridgeReady(function () {
    // 个人微信和企业微信的 visibilitychange 和 onPageStateChange 存在兼容问题，这里使用了两种方案，同时支持需要避免调用两次
    // let lastCalledTime = 0
    // let lastVisible = true
    // const checkCallable = function (visible) {
    //   const now = Date.now()
    //   const callable = now - lastCalledTime > 100 || lastVisible !== visible
    //   lastCalledTime = now
    //   lastVisible = visible
    //   return callable
    // }
    // const onPageStateChange = function (visible) {
    //   if (checkCallable(visible)) {
    //     if (visible) {
    //       pageShowListeners.forEach(function (callback) {
    //         callback()
    //       })
    //     } else {
    //       pageHideListeners.forEach(function (callback) {
    //         callback()
    //       })
    //     }
    //   }
    // }
    // window.addEventListener('visibilitychange', function () {
    //   onPageStateChange(document.visibilityState === 'visible')
    // })
    // if (typeof WeixinJSBridge !== 'undefined') {
    //   WeixinJSBridge.on('onPageStateChange', function (res) {
    //     onPageStateChange(String(res.active) === 'true')
    //   })
    // }
  })

  // isJumpPage 用于标识页面跳转回来后触发的 hashchange，需要区分 history.goBack
  let isJumpPage = false

  // wx 处理
  if (wx && wx.miniProgram && wx.miniProgram.navigateTo) {
    const navigateTo = wx.miniProgram.navigateTo
    wx.miniProgram.navigateTo = function (option) {
      currentEvents = option.events
      isJumpPage = true
      pageHideListeners.forEach(function (callback) {
        callback()
      })
      navigateTo.call(wx.miniProgram, option)
    }
  }

  /**
   * - 切换切换前后台触发
   * - 页面调用 wx.miniProgram.navigateTo 跳转回来后触发
   * - window.history.go(-1) 触发
   */
  window.addEventListener('hashchange', function () {
    let shouldRefresh = false

    // 新参数解析
    const newEnterOptions = getQueryConfig()

    // 刷新检测
    if (config.shouldRefresh?.(newEnterOptions, enterOptions)) {
      shouldRefresh = true

      // 要刷新说明配置发生了较大的变更，需要缓存新的配置
      enterOptions = newEnterOptions
      window.sessionStorage.setItem(
        HASH_TEMP_KEY,
        JSON.stringify(newEnterOptions)
      )
    }

    // 通信处理
    if (
      isJumpPage &&
      currentEvents &&
      newEnterOptions.events &&
      newEnterOptions.events.length > 0
    ) {
      for (let index = 0; index < newEnterOptions.events.length; index++) {
        const event = newEnterOptions.events
        const listener = currentEvents[event.key]
        if (typeof listener === 'function') {
          listener(event.message)
        }
      }
      currentEvents = {}
    }

    // 页面显隐藏回调
    if (newEnterOptions.showing) {
      if (isJumpPage) {
        pageShowListeners.forEach(function (callback) {
          callback()
        })
      } else {
        appShowListeners.forEach(function (callback) {
          callback()
        })
      }
    }
    if (newEnterOptions.hiding) {
      if (isJumpPage) {
        pageHideListeners.forEach(function (callback) {
          callback()
        })
      } else {
        appHideListeners.forEach(function (callback) {
          callback()
        })
      }
    }

    // 页面显隐藏标识位重置
    if (newEnterOptions.showing || newEnterOptions.hiding) {
      window.history.go(-1)
    }

    // 需要刷新
    if (shouldRefresh) {
      setTimeout(function () {
        location.reload()
      }, 50)
    }

    isJumpPage = false
  })

  return enterOptions
}

module.exports = {
  config(options) {
    Object.assign(config, options)
    return setup()
  },
  getLaunchOptions,
  getEnterOptions,
  getOpenerEventChannel,
  offAppHide,
  offAppShow,
  offPageHide,
  offPageShow,
  onAppHide,
  onAppShow,
  onPageHide,
  onPageShow,
}
