module Nyaplot
  add_extension("Elegans")
  add_dependency("THREE","https://cdnjs.cloudflare.com/ajax/libs/three.js/r66/three.min")
  add_dependency("Elegans","https://cdn.rawgit.com/domitry/elegans/d81a728f62edaeeb67261516a272438fb39fa80a/release/elegans")
  init_iruby if defined? IRuby
end
