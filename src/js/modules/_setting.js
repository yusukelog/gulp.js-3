// jquery読み込み
import $ from "jquery";

export default function() {
  $(".js-user-setting").on("click", () => {
    alert("Click!");
  });
}
