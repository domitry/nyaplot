module Nyaplot
  add_extension("Elegans")
  add_dependency("THREE","http://cdnjs.cloudflare.com/ajax/libs/three.js/r66/three.min")
  add_dependency("Elegans","http://cdn.rawgit.com/domitry/elegans/nyaplot-extension/release/elegans")
  init_iruby if defined? IRuby
end
