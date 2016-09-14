require 'haml'
require 'sass'
require 'rack'
require 'yaml'
require 'json'

class Application
  def call env
    [200, {'Content-Type' => 'text/html; charset=utf-8'}, [body]]
  end

  private

  def body
    Haml::Engine.new(File.read('template.haml')).render Object.new, locals
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
