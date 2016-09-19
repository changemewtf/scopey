require 'haml'
require 'sass'
require 'rack'
require 'yaml'
require 'json'

class Application
  def call env
    [200, {'Content-Type' => 'text/html; charset=utf-8'}, [body(env)]]
  end

  private

  def body env
    tmpl = case env["PATH_INFO"]
           when "/events" then "events"
           else "template"
           end

    Haml::Engine.new(File.read(tmpl + ".haml")).render Object.new, locals
  end

  def locals
    data.merge(
      'sass' => sass,
      'javascript' => File.read('script.js'),
      'json' => json
    )
  end

  def data
    YAML.load_file 'data.yaml'
  end

  def sass
    Sass::Engine.new(File.read('style.sass')).render
  end

  def json
    JSON.generate data
  end
end
