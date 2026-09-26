const menu=document.querySelector("[popover]"),query=matchMedia("(min-width: 684px)");query.addEventListener("change",e=>{e.matches&&menu.checkVisibility()&&menu.hidePopover()});
