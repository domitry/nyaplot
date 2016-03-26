module Nyaplot
  add_extension("Mapnya")
  add_additional_library("Mapnya","https://cdn.rawgit.com/domitry/nyaplot/master/lib/mapnya/js/release/mapnya")
  init_iruby if defined? IRuby
end
