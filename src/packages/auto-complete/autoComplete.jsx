import { getStyle, scrollIntoViewIfNeed } from "karma-ui/util/dom"
import { debounce } from "karma-ui/util/throttle_debounce"
import { layer } from "karma-ui/packages/layer/index"
import KInput from "karma-ui/packages/input/input.jsx.vue"
import KOption from "karma-ui/packages/option/option"
import esc from "karma-ui/util/esc.js"
import loading from "karma-ui/directives/loading/index"
export default {
  name: "KAutoComplete",
  components: {
    KInput,
    KOption
  },
  props: {
    ...KInput.props,
    clearable: {
      type: Boolean,
      default: true
    },
    data: {
      type: Array,
      default: () => []
    },
    //弹层的宽度，有值的话，就用那个设置的值，如果设置了空字符串或者false，表示和
    //输入框等宽
    layerWidth: {
      type: [String, Boolean],
      default: "auto"
    },
    //弹层的高度
    layerHeight: {
      type: String,
      default: "auto"
    },
    //keyfield用来向后台提交的字段名(对应的数据)
    keyField: {
      type: String,
      default: "Id"
    },
    //展示的那个字段名(对应的数据)
    valueField: {
      type: String,
      default: "Name"
    },
    //模糊匹配需要搜索的字段
    searchField: {
      type: [String, Array],
      default: "Name"
    },
    //只有展示列表的时候，再初始化layer
    //此参数同时具有收起列表后销毁layer的功能控制
    lazy: {
      type: Boolean,
      default: true
    },
    //前端分页，有值就代表有分页，没有值就没有分页
    pageSize: {
      type: [Number, String],
      default: void 0
    }
  },
  model: {
    prop: "value",
    event: "valueChange"
  },
  data() {
    return {
      //layer实例
      ins: null,
      //提交数据用的，可能是id或者proid等等
      // val: this.value,
      //展示在输入框的那个文本
      inputText: "",
      optionCompName: "",
      isMouseDownOption: false,
      //选中的那个数据的index
      currentIndex: -1,
      currentHoverIndex: -1,
      //filterData
      filterData: JSON.parse(JSON.stringify(this.data)),
      options: [], //收集本组件下属的所有option组件
      optionCompName: "",
      //控制延迟加载的转圈图形显示
      loading: false,
      pageIndex: 1
    }
  },
  computed: {
    totalPages() {
      if (this.pageSize && this.filterData.length) {
        return Math.ceil(this.filterData.length / this.pageSize)
      }
      return 1
    }
  },
  watch: {
    // val(v) {
    //   this.$emit("valueChange", v)
    // },
    data(d) {
      if (d && d.length) {
        this.getInputTextByKeyField()
        this.filterData = JSON.parse(JSON.stringify(d))
        if (document.activeElement == this.$refs.input.getInputElement())
          this.showList()
      }
    },
    value: {
      immediate: true,
      handler(v) {
        this.getInputTextByKeyField()
      }
    },
  },
  methods: {
    handleKeyup(e) {
      const code = e.keyCode
      if (code != 40 && code != 38 && code != 13) {
        return
      }
      let i = this.currentHoverIndex
      const len = this.filterData.length
      if (code == 40) {
        //下
        i += 1
        if (i >= len) {
          i = 0
        }
      } else if (code == 38) {
        i -= 1
        if (i < 0) {
          i = len - 1
        }
      } else if (code == 13) {
        if (this.filterData.length) {
          this.currentIndex =
            this.currentHoverIndex == -1 ? 0 : this.currentHoverIndex
          this.$emit(
            "valueChange",
            this.filterData[this.currentIndex][this.keyField]
          )
          this.$emit("toggle", {
            row: this.filterData[this.currentIndex],
            index: this.currentIndex
          })
          this.hideList(this.destroyLayer)
        }
        return
      }
      this.currentHoverIndex = i
      // console.log(i)
      this.scrollIntoViewIfNeed(i)
      this.$forceUpdate()
    },
    //
    getInputTextByKeyField() {
      let text = ""
      if (
        this.value &&
        this.value !== "" &&
        this.data &&
        this.data.length &&
        this.keyField
      ) {
        for (let i = 0, len = this.data.length; i < len; i++) {
          let item = this.data[i]
          if (item[this.keyField] == this.value) {
            text = item[this.valueField]
            this.currentIndex = i
            this.currentHoverIndex = i
            break
          }
        }
      }
      this.inputText = text
      if(this.inputText === '') {
        this.currentHoverIndex = -1
        this.currentIndex = -1
        this.getFilterData()
      }
      return text
      // this.$emit('toggle',{row,index})
      // return {row,index}
    },
    //外部调用，获取valueField对应的值
    getName() {
      return this.getInputTextByKeyField()
    },
    //外部调用,获取输入框里的文本
    getInputValue() {
      return this.inputText
    },
    //根据inputText获取keyField对应的值
    getValueByInputText() {
      let v = ""
      //将用户输入，转化成关键字数组，以逐个匹配
      const arrText = this.inputText.toLowerCase().split(/\s+/)
      if (
        this.data &&
        this.data.length &&
        this.inputText !== "" &&
        this.inputText !== undefined &&
        this.keyField
      ) {
        if (Array.isArray(this.searchField)) {
        } else if (typeof this.searchField === "string") {
        }
      }
    },
    getFilterData() {
      if (this.inputText.trim() !== "") {
        //将用户输入，转化成关键字数组，以逐个匹配
        const arrText = this.inputText.toLowerCase().split(/\s+/)
        const arrField =
          typeof this.searchField === "string"
            ? [this.searchField]
            : Array.isArray(this.searchField)
            ? this.searchField
            : []
        if (arrField.length === 0) {
          console.warn(`${this.$options.name}是否没有传入searchField参数？`)
        }
        //搜索出来
        let arr = []
        this.data.forEach(item => {
          let has = false
          arrField.forEach(field => {
            const fieldText = (item[field] + "").toLowerCase()
            arrText.forEach(text => {
              text = (text + "").trim()
              if (fieldText.indexOf(text) > -1) {
                has = true
              }
            })
          })
          if (has) {
            arr.push({ ...item })
          }
        })
        this.filterData = arr
        if (arr.length === 0) {
          this.ins.hide()
        } else {
          this.showList(this.scrollIntoViewIfNeed)
        }
        this.$forceUpdate()
      } else {
        this.filterData = this.data
        if (this.$refs.input && document.activeElement == this.$refs.input.getInputElement()) {
          this.showList(this.scrollIntoViewIfNeed)
        }
      }
    },
    handleLayerBodyScroll: debounce(100, function() {
      const body = this.ins.$refs.body
      let bodyHeight = parseFloat(getStyle(body, "height"))
      let scrollTop = body.scrollTop
      let scrollHeight = body.scrollHeight
      if (bodyHeight + scrollTop >= scrollHeight) {
        if (this.totalPages > 1) {
          if (this.pageIndex < this.totalPages) {
            this.pageIndex += 1
            this.$forceUpdate()
          }
        }
      }
    }),
    showList(fn = () => {}) {
      this.$nextTick().then(()=>{
        this.ins &&
          this.ins.show(() => {
            fn()
            // 优化事件绑定时机：由layer抛出事件告诉父组件
            // layer已经初始化完毕，之后进行事件绑定
            // 而不是在layer展示出来后绑定
            // this.ins.$refs.body.addEventListener(
            //   "scroll",
            //   this.handleLayerBodyScroll
            // )
          })
      })
    },
    hideList(cb = () => {}) {
      if (!this.disabled) {
        if (this.ins) {
          //remove事件
          this.ins.$refs.body.removeEventListener(
            "scroll",
            this.handleLayerBodyScroll
          )
          this.ins.hide(cb)
          this.$refs.input.blur()
          this.$nextTick(() => {
            //如果没有选择，或者输入框没有东西，则重置成第一页
            // if(!this.value && !this.inputText) {
            //   this.pageIndex = 1
            //   // console.log('没有value吗？')
            // }
          })
        }
      }
    },
    // scrollIntoView(index) {
    //   let i = 0
    //   if (typeof index === "number") {
    //     i = index
    //   } else {
    //     this.filterData.forEach((el, index) => {
    //       if (el[this.keyField] == this.value) {
    //         i = index
    //       }
    //     })
    //   }
    //   this.getAllOptionsComponent()
    //   if (this.options.length) {
    //     this.ins.$refs.body.scrollTop = offset(
    //       this.options[i].$el,
    //       this.ins.$refs.body
    //     ).top
    //   }
    // },
    scrollIntoViewIfNeed(index) {
      let i = 0
      if (typeof index === "number") {
        i = index
      } else {
        this.filterData.forEach((el, index) => {
          if (el[this.keyField] == this.value) {
            i = index
          }
        })
      }
      this.getAllOptionsComponent()
      if (this.options.length && this.options[i] && this.options[i].$el) {
        scrollIntoViewIfNeed(this.options[i].$el,this.ins.$refs.body)
      }
    },
    getAllOptionsComponent() {
      let arr = []
      const fn = Comp => {
        Comp.$children.forEach(child => {
          if (child.$options.name === this.optionCompName) {
            arr.push(child)
          } else {
            fn(child)
          }
        })
      }
      fn(this.ins)
      this.options = arr
    },
    //可供外部调用
    focus() {
      this.$refs.input.focus()
    },
    inputProps() {
      return {
        directives: [
          {
            name: "esc",
            value: () => {
              this.hideList(this.destroyLayer)
            }
          }
        ],
        ref: "input",
        props: {
          ...this.$props,
          value: this.inputText
        },
        on: {
          ...this.$listeners,
          focus: e => {
            this.$refs.input.onSelect()
            //如果还没有实例化，则先实例化
            if (!this.ins) {
              this.instanceAndOn()
              this.init()
            }
            //如果没有筛选出来的数据，就不显示列表
            if (this.filterData.length !== 0) {
              this.showList(() => {
                this.scrollIntoViewIfNeed()
                this.currentHoverIndex = this.currentIndex
                this.$forceUpdate()
              })
              //如果数据源本身就没有，此时可能是正在延迟加载数据中
            } else if (this.data.length === 0) {
              this.showList()
            }
            this.$emit("focus", e)
          },
          blur: () => {
            if (!this.isMouseDownOption) {
              this.hideList(this.destroyLayer)
            }
          },
          // input: () => {
          //
          // },
          keyup: e => {
            this.handleKeyup(e)
          },
          keydown: e => {
            //阻止光标乱跑。在keyup中阻止不了
            // e.preventDefault()
          },
          valueChange: v => {
            this.pageIndex = 1
            this.inputText = v
            this.currentIndex = this.currentHoverIndex = -1
            if (v.trim() === "") {
              this.$emit("valueChange", "")
              this.$emit("toggle", { row: undefined, index: undefined })
            }
            this.getFilterData()
          }
        }
      }
    },
    instanceAndOn() {
      this.ins = layer()

      this.ins.$on('layer-inited',()=>{
        this.$nextTick().then(()=>{
          this.ins.$refs.body.addEventListener(
            'scroll',
            this.handleLayerBodyScroll
          )
        })
      })
    },
    init() {
      this.$nextTick(() => {
        // console.log('初始化时的pageIndex',this.pageIndex)
        if (this.ins) {
          const {
            layerWidth,
            layerHeight,
            filterData,
            $slots,
            $scopedSlots
          } = this
          if (this.filterData.length === 0) {
            //提示加载中
            this.loading = true
          } else {
            this.loading = false
          }
          const loadingProps = {
            directives: [
              {
                name: "loading",
                value: {
                  loading: this.loading,
                  content: "数据获取中..."
                }
              }
            ],
            style: {
              minHeight: "200px"
            }
          }
          const slotsDefault = $slots.default ||
            (filterData.length &&
              filterData
                .slice(0, this.pageIndex * (this.pageSize || filterData.length))
                .map((item, index) => {
                  const optionProps = {
                    class: {
                      "k-option--hover": index == this.currentHoverIndex
                    },
                    props: {
                      tag: "div",
                      selected: item[this.keyField] == this.value
                    },
                    on: {
                      click: e => {
                        this.currentIndex = index
                        this.$emit("valueChange", item[this.keyField])
                        this.$emit("toggle", { row: item, index })
                        this.hideList(this.destroyLayer)
                      }
                    }
                  }
                  if ($scopedSlots.default) {
                    return (
                      <k-option {...optionProps}>
                        {$scopedSlots.default({
                          row: item,
                          index
                        })}
                      </k-option>
                    )
                  }
                  return (
                    <k-option {...optionProps}>
                      {item[this.valueField]}
                    </k-option>
                  )
                })) || <k-option {...loadingProps} ></k-option>
          const slotsHeader = $slots.header
          const slotsFooter = $slots.footer
          this.ins.init(
            this,
            {
              //列表的插槽内容
              default: slotsDefault,
              //列表头部的内容
              header: slotsHeader,
              //列表底部的内容
              footer: slotsFooter
            },
            {
              //弹框标签类型
              tag: "div",
              //弹框列表头部标签类型
              headerTag: "div",
              //弹框列表底部标签类型
              footerTag: "div",
              //弹框宽。如果不指定宽，则宽度和输入框一致
              width: layerWidth,
              //高度暂时没有设置。TODO
              height: layerHeight
            }
          )
        }
      })
    },
    destroyLayer() {
      if (this.lazy) {
        if (this.ins) {
          this.ins.destroy()
          this.ins = null
        }
      }
    }
  },
  directives: {
    esc,
    loading
  },
  render() {
    const inputProps = this.inputProps()
    return <k-input {...inputProps} />
  },
  beforeDestroy() {
    this.destroyLayer()
  },
  destroyed() {
    if (this.ins) {
      
      // console.log('k-auto-complete被销毁了！当前页：',this.pageIndex)
    }
  },
  mounted() {
    if (!this.lazy) {
      if (!this.ins) {
        this.instanceAndOn()
        this.init()
      }
    }
  },
  updated() {
    this.ins && this.init()
  },
  created() {
    this.$on("getOptionComponentName", name => {
      this.optionCompName = name
    })

    this.$on("inovering", isMouseDownOption => {
      this.isMouseDownOption = isMouseDownOption
      //如果鼠标离开列表，且当前焦点不是此组件的input，则隐藏列表
      if (!isMouseDownOption) {
        if (document.activeElement != this.$refs.input.getInputElement()) {
          this.hideList(this.destroyLayer)
        }
      }
    })
  }
}
