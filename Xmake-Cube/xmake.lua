add_rules("mode.debug", "mode.release", "mode.asan", "mode.check", "mode.tsan", "mode.lsan" ,"mode.ubsan","mode.valgrind")
add_rules("plugin.vsxmake.autoupdate")
add_rules("plugin.compile_commands.autoupdate")

set_languages("c17")

set_warnings("allextra")

add_cxflags("gcc::-Wconversion")
add_cxflags("gcc::-Wsign-conversion")
add_cxxflags("gcc::-Wconversion")
add_cxxflags("gcc::-Wsign-conversion")

add_cxxflags("cl::/Za")
add_cxxflags("cl::/DUNICODE")
add_cxflags("cl::/DUNICODE")

if is_mode("debug") then
  -- this include ucrtbased.dll in the binary
  add_cxxflags("cl::/MDd")
end

target("cube")
  set_kind("binary")
  add_files("src/main.c")