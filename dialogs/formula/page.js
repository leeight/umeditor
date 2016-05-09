/**
 * Copyright (c) 2014 Baidu.com, Inc. All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

$(function(){
    var MQ = MathQuill.getInterface(2);

    var UM = parent.UM,
        $iframe = $(getSelfIframe()),
        editorId = $iframe.parents('.edui-body-container').attr('id'),
        editor = UM.getEditor(editorId),
        timer;

    /* 获得当前公式所在的iframe节点 */
    function getSelfIframe(){
        var iframes = parent.document.getElementsByTagName('iframe');
        for (var key in iframes) {
            if (iframes[key].contentWindow == window) {
                return iframes[key];
            }
        }
        return null;
    }
    /* 获得当前url上的hash存储的参数值 */
    function getLatex() {
        return $iframe.attr('data-latex') || '';
    }
    /* 保存场景 */
    function saveScene(){
        timer && clearTimeout(timer);
        timer = setTimeout(function(){
            editor.fireEvent('savescene');
            editor.fireEvent('contentchange');
            editor.fireEvent('selectionchange');
            timer = null;
        }, 300);
    }
    /* 设置编辑器可编辑 */
    function enableEditor(){
        if(editor.body.contentEditable == 'false') {
            editor.setEnabled();
        }
    }
    /* 设置编辑器不可编辑 */
    function disableEditor(){
        if(editor.body.contentEditable == 'true') {
            editor.setDisabled(['undo', 'redo', 'preview', 'formula'], true);
        }
    }

    /* 公式 */
    var Formula = function(){
        var _this = this,
            latex = getLatex();

        this.isFocus = false;
        this.isDisabled = false;

        /* 加载公式内容 */
        this.$mathquill = $('.mathquill-editable');
        this.$mathquill.text(latex);

        this.mq = MQ.MathField(this.$mathquill.get(0));

        /* 设置活动状态的公式iframe */
        this.$mathquill.on('mousedown', function(){
            /* 编辑器不可用时,公式也不可用 */
            if(_this.disabled) return false;

            /* 第一次点击当前公式,设置公式活动 */
            if(!$iframe.hasClass('edui-formula-active')) {
                disableEditor();
                editor.blur();
                editor.$body.find('iframe').not($iframe).each(function(k, v){
                    v.contentWindow.formula.blur();
                });
                if($('.mathquill-editable').find('.cursor').css('display') == 'none') {
                    _this.refresh();
                    _this.$mathquill.addClass('hasCursor');
                }
            }
            _this.focus();
        });
        editor.addListener('click', function(){
            _this.blur();
            enableEditor();
        });

        /* 里面focus,编辑器也判断为focus */
        editor.addListener('isFocus', function(){
            return _this.isFocus;
        });
        /* um不可用,公式也不可编辑 */
        editor.addListener('setDisabled', function(type, except){
            if (!(except && except.join(' ').indexOf('formula') != -1) && _this.isDisabled != true ) {
                _this.setDisabled();
            }
        });
        editor.addListener('setEnabled', function(){
            if (_this.isDisabled != false) {
                _this.setEnabled();
            }
        });

        /* 设置更新外层iframe的大小和属性 */
        $(document.body).on('keydown', function(){
            _this.updateIframe();
        }).on('keyup', function(){
            _this.updateIframe();
        });

        /* 清除初始化的高亮状态 */
        this.$mathquill.removeClass('hasCursor');

        /* 初始化后延迟刷新外层iframe大小 */
        setTimeout(function(){
            _this.updateIframe();
        }, 300);
    };

    Formula.prototype = {
        focus:function(){
            $iframe.addClass('edui-formula-active');
            this.isFocus = true;
        },
        blur:function(){
            $iframe.removeClass('edui-formula-active');
            this.removeCursor();
            this.isFocus = false;
        },
        removeCursor: function(){
            this.$mathquill.find('span.cursor').hide();
            this.$mathquill.parent().find('.hasCursor').removeClass('hasCursor');
        },
        updateIframe: function(){
            $iframe.width(this.$mathquill.width() + 8)
                .height(this.$mathquill.height() + 8);
            var latex = $iframe.attr('data-latex'),
                newLatex = this.getLatex();
            if(latex != newLatex) {
                $iframe.attr('data-latex', this.getLatex());
                saveScene();
            }
        },
        getLatex: function(){
            return this.mq.latex();
        },
        setDisabled: function(){
            this.blur();
            this.refresh();
            this.isDisabled = true;
        },
        setEnabled: function(){
            this.$mathquill.removeClass('mathquill-rendered-math');
            this.refresh();
            this.isDisabled = false;
        },
        refresh: function(){
            this.mq.latex(this.getLatex());
            this.updateIframe();
        }
    };

    /* 绑定到window上，给上级window调用 */
    window.formula = new Formula();
});











/* vim: set ts=4 sw=4 sts=4 tw=120: */
