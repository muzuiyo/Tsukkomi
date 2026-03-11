const siteConfig = {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    siteInfo: {
        title: "Tsukkomi 备忘录",
        subTitle: "吐槽、笔记，和想象有关的"
    },
    // 控制每次获取数目：API 限制最大 20
    pageSize: 20,
    // 用于控制是否显示注册 UI
    allowRegister: false,
}

export default siteConfig;